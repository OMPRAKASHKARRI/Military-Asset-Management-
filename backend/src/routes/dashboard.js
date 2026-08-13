const express = require("express");
const prisma = require("../prisma");
const { authenticate, resolveScopedBaseId } = require("../middleware/auth");
const { getDashboardMetrics } = require("../utils/inventory");

const router = express.Router();

router.get("/metrics", authenticate, async (req, res, next) => {
  try {
    const { equipmentTypeId, startDate, endDate, baseId } = req.query;
    const effectiveBaseId = resolveScopedBaseId(req, baseId);

    const metrics = await getDashboardMetrics({
      baseId: effectiveBaseId,
      equipmentTypeId,
      startDate,
      endDate,
    });

    // Category breakdown (for "assets by category" chart), scoped the same way.
    const equipmentTypes = await prisma.equipmentType.findMany();
    const categoryBreakdown = {};
    for (const et of equipmentTypes) {
      const m = await getDashboardMetrics({
        baseId: effectiveBaseId,
        equipmentTypeId: et.id,
        startDate,
        endDate,
      });
      categoryBreakdown[et.category] = (categoryBreakdown[et.category] || 0) + m.closingBalance;
    }

    // Recent transfer activity (last 8) for the chart, scoped by base.
    const transferWhere = {};
    if (effectiveBaseId) {
      transferWhere.OR = [
        { sourceBaseId: Number(effectiveBaseId) },
        { destinationBaseId: Number(effectiveBaseId) },
      ];
    }
    const recentTransfers = await prisma.transfer.findMany({
      where: transferWhere,
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { equipmentType: true, sourceBase: true, destinationBase: true },
    });

    // Expenditure trend (last 8 expenditures), scoped by base.
    const expenditureWhere = effectiveBaseId ? { baseId: Number(effectiveBaseId) } : {};
    const recentExpenditures = await prisma.expenditure.findMany({
      where: expenditureWhere,
      orderBy: { recordedAt: "desc" },
      take: 8,
      include: { equipmentType: true },
    });

    res.json({
      metrics,
      categoryBreakdown,
      recentTransfers,
      recentExpenditures,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
