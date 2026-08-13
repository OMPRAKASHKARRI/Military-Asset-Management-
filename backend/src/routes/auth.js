const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { ApiError } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new ApiError(400, "Username and password are required");
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new ApiError(401, "Invalid username or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Invalid username or password");
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, baseId: user.baseId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { passwordHash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
