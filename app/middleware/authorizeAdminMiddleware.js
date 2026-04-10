function authorizeAdminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeAdminMiddleware;
