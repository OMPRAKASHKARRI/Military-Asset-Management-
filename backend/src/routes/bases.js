const express = require("express");
const prisma = require("../prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const bases = await prisma.base.findMany({ orderBy: { name: "asc" } });
    res.json(bases);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
