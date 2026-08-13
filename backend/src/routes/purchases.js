const express = require("express");
const prisma = require("../prisma");
const { authenticate, authorize, resolveScopedBaseId } = require("../middleware/auth");
const { ApiError } = require("../middleware/errorHandler");
const { writeAuditLog } = require("../utils/audit");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const effectiveBaseId = resolveScopedBaseId(req, baseId);

    const where = {};
    if (effectiveBaseId) where.baseId = Number(effectiveBaseId);
    if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { base: true, equipmentType: true, createdBy: { select: { id: true, username: true } } },
      orderBy: { date: "desc" },
    });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"),
  async (req, res, next) => {
    try {
      const { equipmentTypeId, quantity, date, baseId } = req.body || {};
      const effectiveBaseId = resolveScopedBaseId(req, baseId);

      if (!effectiveBaseId || !equipmentTypeId || !quantity || !date) {
        throw new ApiError(400, "baseId, equipmentTypeId, quantity and date are required");
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
        const purchase = await tx.purchase.create({
          data: {
            baseId: Number(effectiveBaseId),
            equipmentTypeId: Number(equipmentTypeId),
            quantity: qty,
            date: new Date(date),
            createdById: req.user.userId,
          },
          include: { base: true, equipmentType: true },
        });

        await writeAuditLog(tx, {
          userId: req.user.userId,
          action: "PURCHASE",
          details: `User recorded purchase of ${qty} ${equipmentType.name} at ${base.name}.`,
        });

        return purchase;
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
