const express = require("express");
const prisma = require("../prisma");
const { authenticate, authorize } = require("../middleware/auth");
const { ApiError } = require("../middleware/errorHandler");
const { writeAuditLog } = require("../utils/audit");
const { getAvailableStock } = require("../utils/inventory");
const { resolveScopedBaseId } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const effectiveBaseId = resolveScopedBaseId(req, baseId);

    const where = {};
    if (effectiveBaseId) {
      where.OR = [{ sourceBaseId: Number(effectiveBaseId) }, { destinationBaseId: Number(effectiveBaseId) }];
    }
    if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        sourceBase: true,
        destinationBase: true,
        equipmentType: true,
        initiatedBy: { select: { id: true, username: true } },
      },
      orderBy: { timestamp: "desc" },
    });
    res.json(transfers);
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
      const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } = req.body || {};

      // 1. Validate required fields
      if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity) {
        throw new ApiError(400, "sourceBaseId, destinationBaseId, equipmentTypeId and quantity are required");
      }

      // BASE_COMMANDER may only move assets out of their own base.
      if (req.user.role === "BASE_COMMANDER" && Number(sourceBaseId) !== Number(req.user.baseId)) {
        throw new ApiError(403, "Base commanders may only transfer from their assigned base");
      }

      if (Number(sourceBaseId) === Number(destinationBaseId)) {
        throw new ApiError(400, "Source and destination base must be different");
      }

      // 4. Validate quantity
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ApiError(400, "quantity must be a positive integer");
      }

      // 2. Validate destination / 1. Validate source / 3. Validate equipment
      const [sourceBase, destinationBase, equipmentType] = await Promise.all([
        prisma.base.findUnique({ where: { id: Number(sourceBaseId) } }),
        prisma.base.findUnique({ where: { id: Number(destinationBaseId) } }),
        prisma.equipmentType.findUnique({ where: { id: Number(equipmentTypeId) } }),
      ]);
      if (!sourceBase) throw new ApiError(404, "Source base not found");
      if (!destinationBase) throw new ApiError(404, "Destination base not found");
      if (!equipmentType) throw new ApiError(404, "Equipment type not found");

      const result = await prisma.$transaction(async (tx) => {
        // 5. Calculate available inventory (inside the transaction to guard
        //    against races) / 6. Reject insufficient stock
        const available = await getAvailableStock(sourceBaseId, equipmentTypeId, { client: tx });
        if (available < qty) {
          throw new ApiError(409, `Insufficient stock at ${sourceBase.name}: ${available} available, ${qty} requested`);
        }

        // 7. Create transfer
        const transfer = await tx.transfer.create({
          data: {
            sourceBaseId: Number(sourceBaseId),
            destinationBaseId: Number(destinationBaseId),
            equipmentTypeId: Number(equipmentTypeId),
            quantity: qty,
            status: "COMPLETED",
            initiatedById: req.user.userId,
          },
          include: { sourceBase: true, destinationBase: true, equipmentType: true },
        });

        // 8. Create audit log
        await writeAuditLog(tx, {
          userId: req.user.userId,
          action: "TRANSFER",
          details: `User transferred ${qty} ${equipmentType.name} from ${sourceBase.name} to ${destinationBase.name}.`,
        });

        // 9. Commit happens automatically when this callback resolves;
        //    throwing anywhere above rolls the whole transaction back.
        return transfer;
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
