const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // Wipe existing data (order matters for FKs).
  await prisma.auditLog.deleteMany();
  await prisma.expenditure.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.user.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.base.deleteMany();

  const [alpha, bravo, charlie] = await Promise.all([
    prisma.base.create({ data: { name: "Fort Alpha", location: "Colorado, USA" } }),
    prisma.base.create({ data: { name: "Fort Bravo", location: "Texas, USA" } }),
    prisma.base.create({ data: { name: "Fort Charlie", location: "Georgia, USA" } }),
  ]);

  const [m4, humvee, ammo] = await Promise.all([
    prisma.equipmentType.create({ data: { name: "M4 Carbine", category: "WEAPON" } }),
    prisma.equipmentType.create({ data: { name: "Humvee", category: "VEHICLE" } }),
    prisma.equipmentType.create({ data: { name: "5.56mm Ammo", category: "AMMUNITION" } }),
  ]);

  const adminHash = await bcrypt.hash("AdminPass123!", 10);
  const commanderHash = await bcrypt.hash("CommandPass123!", 10);
  const logisticsHash = await bcrypt.hash("LogisticsPass123!", 10);

  const admin = await prisma.user.create({
    data: { username: "admin_user", passwordHash: adminHash, role: "ADMIN" },
  });
  const commander = await prisma.user.create({
    data: { username: "commander_alpha", passwordHash: commanderHash, role: "BASE_COMMANDER", baseId: alpha.id },
  });
  const logistics = await prisma.user.create({
    data: { username: "logistics_officer", passwordHash: logisticsHash, role: "LOGISTICS_OFFICER", baseId: alpha.id },
  });

  // --- Purchases (establish initial stock at each base) ---
  const purchases = [
    { base: alpha, eq: m4, qty: 200, date: daysAgo(60), by: logistics },
    { base: alpha, eq: humvee, qty: 25, date: daysAgo(58), by: logistics },
    { base: alpha, eq: ammo, qty: 50000, date: daysAgo(55), by: logistics },
    { base: bravo, eq: m4, qty: 150, date: daysAgo(50), by: admin },
    { base: bravo, eq: humvee, qty: 15, date: daysAgo(48), by: admin },
    { base: bravo, eq: ammo, qty: 30000, date: daysAgo(45), by: admin },
    { base: charlie, eq: m4, qty: 100, date: daysAgo(40), by: admin },
    { base: charlie, eq: humvee, qty: 10, date: daysAgo(38), by: admin },
    { base: charlie, eq: ammo, qty: 20000, date: daysAgo(35), by: admin },
    { base: alpha, eq: m4, qty: 30, date: daysAgo(10), by: logistics },
    { base: alpha, eq: ammo, qty: 8000, date: daysAgo(5), by: logistics },
  ];
  for (const p of purchases) {
    await prisma.purchase.create({
      data: {
        baseId: p.base.id,
        equipmentTypeId: p.eq.id,
        quantity: p.qty,
        date: p.date,
        createdById: p.by.id,
      },
    });
  }

  // --- Transfers ---
  const transfers = [
    { src: alpha, dst: bravo, eq: m4, qty: 20, ts: daysAgo(20), by: admin },
    { src: alpha, dst: charlie, eq: ammo, qty: 5000, ts: daysAgo(18), by: admin },
    { src: bravo, dst: charlie, eq: humvee, qty: 3, ts: daysAgo(12), by: admin },
  ];
  for (const t of transfers) {
    await prisma.transfer.create({
      data: {
        sourceBaseId: t.src.id,
        destinationBaseId: t.dst.id,
        equipmentTypeId: t.eq.id,
        quantity: t.qty,
        status: "COMPLETED",
        initiatedById: t.by.id,
        timestamp: t.ts,
      },
    });
  }

  // --- Assignments ---
  const assignments = [
    { base: alpha, eq: m4, name: "Sgt. J. Rivera", qty: 15, ts: daysAgo(9), by: commander },
    { base: alpha, eq: ammo, name: "2nd Platoon", qty: 4000, ts: daysAgo(7), by: commander },
    { base: bravo, eq: m4, qty: 10, name: "Sgt. K. Long", ts: daysAgo(6), by: admin },
  ];
  for (const a of assignments) {
    await prisma.assignment.create({
      data: {
        baseId: a.base.id,
        equipmentTypeId: a.eq.id,
        personnelName: a.name,
        quantity: a.qty,
        assignedById: a.by.id,
        assignedAt: a.ts,
      },
    });
  }

  // --- Expenditures ---
  const expenditures = [
    { base: alpha, eq: ammo, qty: 2000, reason: "Live-fire training exercise", ts: daysAgo(4), by: commander },
    { base: bravo, eq: ammo, qty: 1500, reason: "Range qualification", ts: daysAgo(3), by: admin },
  ];
  for (const e of expenditures) {
    await prisma.expenditure.create({
      data: {
        baseId: e.base.id,
        equipmentTypeId: e.eq.id,
        quantity: e.qty,
        reason: e.reason,
        recordedById: e.by.id,
        recordedAt: e.ts,
      },
    });
  }

  // --- Audit logs for the above (illustrative, not exhaustive) ---
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "TRANSFER", details: "User admin_user transferred 20 M4 Carbine from Fort Alpha to Fort Bravo." },
  });
  await prisma.auditLog.create({
    data: { userId: commander.id, action: "EXPENDITURE", details: "User commander_alpha recorded expenditure of 2000 5.56mm Ammo at Fort Alpha (Live-fire training exercise)." },
  });

  console.log("Seed complete.");
  console.log("Demo users:");
  console.log("  admin_user / AdminPass123!");
  console.log("  commander_alpha / CommandPass123! (Fort Alpha)");
  console.log("  logistics_officer / LogisticsPass123! (Fort Alpha)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
