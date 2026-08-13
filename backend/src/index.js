require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const baseRoutes = require("./routes/bases");
const equipmentTypeRoutes = require("./routes/equipmentTypes");
const purchaseRoutes = require("./routes/purchases");
const transferRoutes = require("./routes/transfers");
const assignmentRoutes = require("./routes/assignments");
const expenditureRoutes = require("./routes/expenditures");
const auditLogRoutes = require("./routes/auditLogs");
const userRoutes = require("./routes/users");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bases", baseRoutes);
app.use("/api/equipment-types", equipmentTypeRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/expenditures", expenditureRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Military Asset Management API listening on port ${PORT}`);
});
