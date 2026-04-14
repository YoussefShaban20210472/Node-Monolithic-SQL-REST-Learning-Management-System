function authorizeAdminInstructorMiddleware(req, res, next) {
  if (req.user.role == "student") {
    throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeAdminInstructorMiddleware;
