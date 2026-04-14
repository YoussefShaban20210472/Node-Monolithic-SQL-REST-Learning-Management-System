function authorizeAdminStudentMiddleware(req, res, next) {
  if (req.user.role == "instructor") {
    throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeAdminStudentMiddleware;
