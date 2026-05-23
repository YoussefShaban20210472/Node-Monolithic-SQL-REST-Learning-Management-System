const userService = require("../service/userService");
const {
  instructorIDSchema,
  studentIDSchema,
} = require("../validator/userIDValidator");
async function validateStudentIDPassedByAdminMiddleware(req, res, next) {
  if (req.user.role == "admin") {
    const validatedBody = studentIDSchema.parse(req.body);
    const student_id = validatedBody.student_id;
    await userService.assertValidUserId("student", student_id);
  }
  next();
}
async function validateStudentIDPassedByAdminInstructorMiddleware(
  req,
  res,
  next,
) {
  if (req.user.role != "student") {
    const validatedBody = studentIDSchema.parse(req.body);
    const student_id = validatedBody.student_id;
    await userService.assertValidUserId("student", student_id);
  }
  next();
}
async function validateInstructorIDPassedByAdminMiddleware(req, res, next) {
  if (req.user.role == "admin") {
    const validatedBody = instructorIDSchema.parse(req.body);
    const instructor_id = validatedBody.instructor_id;
    await userService.assertValidUserId("instructor", instructor_id);
  }
  next();
}

module.exports = {
  validateStudentIDPassedByAdminMiddleware,
  validateInstructorIDPassedByAdminMiddleware,
  validateStudentIDPassedByAdminInstructorMiddleware,
};
