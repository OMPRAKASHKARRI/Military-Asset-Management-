const express = require("express");
const prisma = require("../prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const types = await prisma.equipmentType.findMany({ orderBy: { name: "asc" } });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
