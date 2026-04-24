const courseService = require("../service/courseService");
const enrollmentService = require("../service/enrollmentService");

async function ensureUserInCourseMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  let course = await courseService.getCourseById(course_id);
  let error = false;
  if (req.user.role == "instructor") {
    if (`${course.instructor_id}` != `${req.user.id}`) error = true;
  } else if (req.user.role == "student") {
    let student_id = req.user.id;
    try {
      let enrollment = await enrollmentService.getEnrollment(
        { student_id },
        course_id,
      );
      if (enrollment.status != "accepted") {
        error = true;
      }
    } catch {
      error = true;
    }
  }
  if (error) {
    throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = ensureUserInCourseMiddleware;
