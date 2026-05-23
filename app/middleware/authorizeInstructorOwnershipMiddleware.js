const courseService = require("../service/courseService");

async function authorizeInstructorOwnershipMiddleware(req, res, next) {
  if (req.user.role == "instructor") {
    let course_id = req.params.course_id;
    let course = req.course || (await courseService.getCourseById(course_id));

    if (`${course.instructor_id}` != `${req.user.id}`)
      throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeInstructorOwnershipMiddleware;
