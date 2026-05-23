function badSolutionForSubmissionMiddleware(req, res, next) {
  if (req.user.role == "admin") {
    const student_id = req.headers.student_id;
    if (student_id) {
      req.body = { student_id };
    }
  }
  next();
}

module.exports = badSolutionForSubmissionMiddleware;
