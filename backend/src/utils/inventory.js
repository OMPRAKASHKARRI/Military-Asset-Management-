const prisma = require("../prisma");

// Build a common where-clause fragment for base/equipment scoping.
function scopeWhere({ baseId, equipmentTypeId }, baseField = "baseId") {
  const where = {};
  if (baseId) where[baseField] = Number(baseId);
  if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);
  return where;
}

async function sumQuantity(model, where, client = prisma) {
  const result = await client[model].aggregate({
    _sum: { quantity: true },
    where,
  });
  return result._sum.quantity || 0;
}

// Current available stock for a specific base + equipment type, "as of" an
// optional cutoff date (defaults to now). Used to validate transfers,
// assignments and expenditures so inventory never goes negative.
async function getAvailableStock(baseId, equipmentTypeId, { before, client = prisma } = {}) {
  const dateFilter = before ? { lt: before } : undefined;

  const purchases = await sumQuantity(
    "purchase",
    { baseId: Number(baseId), equipmentTypeId: Number(equipmentTypeId), ...(dateFilter ? { date: dateFilter } : {}) },
    client
  );
  const transfersIn = await sumQuantity(
    "transfer",
    {
      destinationBaseId: Number(baseId),
      equipmentTypeId: Number(equipmentTypeId),
      status: "COMPLETED",
      ...(dateFilter ? { timestamp: dateFilter } : {}),
    },
    client
  );
  const transfersOut = await sumQuantity(
    "transfer",
    {
      sourceBaseId: Number(baseId),
      equipmentTypeId: Number(equipmentTypeId),
      status: "COMPLETED",
      ...(dateFilter ? { timestamp: dateFilter } : {}),
    },
    client
  );
  const assigned = await sumQuantity(
    "assignment",
    { baseId: Number(baseId), equipmentTypeId: Number(equipmentTypeId), ...(dateFilter ? { assignedAt: dateFilter } : {}) },
    client
  );
  const expended = await sumQuantity(
    "expenditure",
    { baseId: Number(baseId), equipmentTypeId: Number(equipmentTypeId), ...(dateFilter ? { recordedAt: dateFilter } : {}) },
    client
  );

  return purchases + transfersIn - transfersOut - assigned - expended;
}

// Full dashboard metrics for a filter set: opening balance is computed from
// everything strictly before `startDate`; the period figures (purchases,
// transfers, assigned, expended) are computed within [startDate, endDate].
async function getDashboardMetrics({ baseId, equipmentTypeId, startDate, endDate }) {
  const base = scopeWhere({ baseId, equipmentTypeId });
  const dest = scopeWhere({ baseId, equipmentTypeId }, "destinationBaseId");
  const src = scopeWhere({ baseId, equipmentTypeId }, "sourceBaseId");

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

  // Opening balance = everything before the range start.
  let opening = 0;
  if (start) {
    const openingPurchases = await sumQuantity("purchase", { ...base, date: { lt: start } });
    const openingTransfersIn = await sumQuantity("transfer", { ...dest, status: "COMPLETED", timestamp: { lt: start } });
    const openingTransfersOut = await sumQuantity("transfer", { ...src, status: "COMPLETED", timestamp: { lt: start } });
    const openingAssigned = await sumQuantity("assignment", { ...base, assignedAt: { lt: start } });
    const openingExpended = await sumQuantity("expenditure", { ...base, recordedAt: { lt: start } });
    opening = openingPurchases + openingTransfersIn - openingTransfersOut - openingAssigned - openingExpended;
  }

  const periodDateFilterPurchase = {};
  const periodDateFilterTransfer = {};
  const periodDateFilterAssignment = {};
  const periodDateFilterExpenditure = {};
  if (start || end) {
    const range = {};
    if (start) range.gte = start;
    if (end) range.lte = end;
    periodDateFilterPurchase.date = range;
    periodDateFilterTransfer.timestamp = range;
    periodDateFilterAssignment.assignedAt = range;
    periodDateFilterExpenditure.recordedAt = range;
  }

  const purchases = await sumQuantity("purchase", { ...base, ...periodDateFilterPurchase });
  const transfersIn = await sumQuantity("transfer", { ...dest, status: "COMPLETED", ...periodDateFilterTransfer });
  const transfersOut = await sumQuantity("transfer", { ...src, status: "COMPLETED", ...periodDateFilterTransfer });
  const assigned = await sumQuantity("assignment", { ...base, ...periodDateFilterAssignment });
  const expended = await sumQuantity("expenditure", { ...base, ...periodDateFilterExpenditure });

  const netMovement = purchases + transfersIn - transfersOut;
  const closing = opening + netMovement - assigned - expended;

  return {
    openingBalance: opening,
    purchases,
    transfersIn,
    transfersOut,
    netMovement,
    assigned,
    expended,
    closingBalance: closing,
  };
}

module.exports = { getAvailableStock, getDashboardMetrics, scopeWhere, sumQuantity };
