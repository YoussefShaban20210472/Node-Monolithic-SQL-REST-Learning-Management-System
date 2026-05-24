const { AccessDeny } = require("../error/businessError");

function authorizeAdminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    throw new AccessDeny();
  }
  next();
}

module.exports = authorizeAdminMiddleware;
