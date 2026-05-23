const courseService = require("../service/courseService");
const enrollmentService = require("../service/enrollmentService");

async function ensureStudentEnrolledInCourseMiddleware(req, res, next) {
  if (req.user.role == "student") {
    let course_id = req.params.course_id;
    let course = req.course || (await courseService.getCourseById(course_id));
    let error = false;

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

    if (error) {
      throw { status: 401, message: "Access denied" };
    }
  }
  next();
}

module.exports = ensureStudentEnrolledInCourseMiddleware;
