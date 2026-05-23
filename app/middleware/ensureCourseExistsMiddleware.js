const courseService = require("../service/courseService");

async function ensureCourseExistsMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  req.course = await courseService.getCourseById(course_id);
  next();
}

module.exports = ensureCourseExistsMiddleware;
