const express = require("express");
const prisma = require("../prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Audit logs are visible to ADMIN (all) and BASE_COMMANDER (read-only,
// global view of actions since audit entries aren't base-scoped in the
// schema; this matches the "Audit Logs" sidebar item shown to commanders).
router.get("/", authenticate, authorize("ADMIN", "BASE_COMMANDER"), async (req, res, next) => {
  try {
    const { action, userId, startDate, endDate } = req.query;
    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = Number(userId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, username: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
