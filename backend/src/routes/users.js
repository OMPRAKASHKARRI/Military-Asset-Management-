const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { authenticate, authorize } = require("../middleware/auth");
const { ApiError } = require("../middleware/errorHandler");
const { writeAuditLog } = require("../utils/audit");

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, baseId: true, createdAt: true, base: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { username, password, role, baseId } = req.body || {};
    if (!username || !password || !role) {
      throw new ApiError(400, "username, password and role are required");
    }
    if (!["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
    if (role !== "ADMIN" && !baseId) {
      throw new ApiError(400, "baseId is required for this role");
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new ApiError(409, "Username already exists");

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          role,
          baseId: baseId ? Number(baseId) : null,
        },
        select: { id: true, username: true, role: true, baseId: true, createdAt: true },
      });

      await writeAuditLog(tx, {
        userId: req.user.userId,
        action: "USER_CREATED",
        details: `Created user ${username} with role ${role}.`,
      });

      return user;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
