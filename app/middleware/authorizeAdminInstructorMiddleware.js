const { AccessDeny } = require("../error/businessError");
function authorizeAdminInstructorMiddleware(req, res, next) {
  if (req.user.role == "student") {
    throw new AccessDeny();
  }
  next();
}

module.exports = authorizeAdminInstructorMiddleware;
