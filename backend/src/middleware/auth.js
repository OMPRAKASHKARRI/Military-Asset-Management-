const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role, baseId }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restrict a route to a given set of roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    return next();
  };
}

// Resolve the effective baseId to use for a request:
// - ADMIN and LOGISTICS_OFFICER may operate against a baseId supplied in the
//   request (query or body), defaulting to their own if none is given.
// - BASE_COMMANDER is ALWAYS forced to req.user.baseId, no matter what the
//   frontend sends. Any mismatching baseId in the request is rejected.
function resolveScopedBaseId(req, requestedBaseId) {
  const { role, baseId: userBaseId } = req.user;

  if (role === "BASE_COMMANDER") {
    if (
      requestedBaseId !== undefined &&
      requestedBaseId !== null &&
      requestedBaseId !== "" &&
      Number(requestedBaseId) !== Number(userBaseId)
    ) {
      const err = new Error("Base commanders may only access their assigned base");
      err.status = 403;
      throw err;
    }
    return userBaseId;
  }

  if (requestedBaseId !== undefined && requestedBaseId !== null && requestedBaseId !== "") {
    return Number(requestedBaseId);
  }
  return userBaseId ?? null;
}

module.exports = { authenticate, authorize, resolveScopedBaseId };
