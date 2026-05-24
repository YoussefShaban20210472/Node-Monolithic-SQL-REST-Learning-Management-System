const userService = require("../service/userService");
const courseService = require("../service/courseService");
const enrollmentService = require("../service/enrollmentService");
const {
  instructorIDSchema,
  studentIDSchema,
} = require("../validator/userIDValidator");
const { BadRequest } = require("../error/businessError");
async function validateAndAuthorize(req) {
  const validatedBody = studentIDSchema.parse(req.body);
  const student_id = validatedBody.student_id;
  await userService.assertValidUserId("student", student_id);

  let course_id = req.params.course_id;
  let course = req.course || (await courseService.getCourseById(course_id));
  let error = false;

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
    throw new BadRequest("Student is not enrolled to the course");
  }
}
async function validateAndAuthorizeStudentIDPassedByAdminMiddleware(
  req,
  res,
  next,
) {
  if (req.user.role == "admin") {
    await validateAndAuthorize(req);
  }
  next();
}
async function validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware(
  req,
  res,
  next,
) {
  if (req.user.role != "student") {
    await validateAndAuthorize(req);
  }
  next();
}

module.exports = {
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware,
};
