const express = require("express");
const prisma = require("../prisma");
const { authenticate, authorize, resolveScopedBaseId } = require("../middleware/auth");
const { ApiError } = require("../middleware/errorHandler");
const { writeAuditLog } = require("../utils/audit");
const { getAvailableStock } = require("../utils/inventory");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const effectiveBaseId = resolveScopedBaseId(req, baseId);

    const where = {};
    if (effectiveBaseId) where.baseId = Number(effectiveBaseId);
    if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);

    const expenditures = await prisma.expenditure.findMany({
      where,
      include: { base: true, equipmentType: true, recordedBy: { select: { id: true, username: true } } },
      orderBy: { recordedAt: "desc" },
    });
    res.json(expenditures);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER"),
  async (req, res, next) => {
    try {
      const { equipmentTypeId, quantity, reason, baseId } = req.body || {};
      const effectiveBaseId = resolveScopedBaseId(req, baseId);

      if (!effectiveBaseId || !equipmentTypeId || !quantity || !reason) {
        throw new ApiError(400, "baseId, equipmentTypeId, quantity and reason are required");
      }
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ApiError(400, "quantity must be a positive integer");
      }

      const [base, equipmentType] = await Promise.all([
        prisma.base.findUnique({ where: { id: Number(effectiveBaseId) } }),
        prisma.equipmentType.findUnique({ where: { id: Number(equipmentTypeId) } }),
      ]);
      if (!base) throw new ApiError(404, "Base not found");
      if (!equipmentType) throw new ApiError(404, "Equipment type not found");

      const result = await prisma.$transaction(async (tx) => {
        const available = await getAvailableStock(effectiveBaseId, equipmentTypeId, { client: tx });
        if (available < qty) {
          throw new ApiError(409, `Insufficient stock at ${base.name}: ${available} available, ${qty} requested`);
        }

        const expenditure = await tx.expenditure.create({
          data: {
            baseId: Number(effectiveBaseId),
            equipmentTypeId: Number(equipmentTypeId),
            quantity: qty,
            reason,
            recordedById: req.user.userId,
          },
          include: { base: true, equipmentType: true },
        });

        await writeAuditLog(tx, {
          userId: req.user.userId,
          action: "EXPENDITURE",
          details: `User expended ${qty} ${equipmentType.name} at ${base.name} (${reason}).`,
        });

        return expenditure;
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
