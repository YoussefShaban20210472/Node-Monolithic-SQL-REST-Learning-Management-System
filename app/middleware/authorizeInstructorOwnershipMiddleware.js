const courseService = require("../service/courseService");

async function authorizeInstructorOwnershipMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  if (req.user.role == "instructor") {
    let course = await courseService.getCourseById(course_id);
    if (`${course.instructor_id}` != `${req.user.id}`)
      throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeInstructorOwnershipMiddleware;
