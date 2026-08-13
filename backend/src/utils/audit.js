// Writes an audit log row using a Prisma transaction client (tx).
async function writeAuditLog(tx, { userId, action, details }) {
  return tx.auditLog.create({
    data: { userId, action, details },
  });
}

module.exports = { writeAuditLog };
