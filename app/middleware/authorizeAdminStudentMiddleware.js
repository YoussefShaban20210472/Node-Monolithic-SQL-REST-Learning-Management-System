const { AccessDeny } = require("../error/businessError");

function authorizeAdminStudentMiddleware(req, res, next) {
  if (req.user.role == "instructor") {
    throw new AccessDeny();
  }
  next();
}

module.exports = authorizeAdminStudentMiddleware;
