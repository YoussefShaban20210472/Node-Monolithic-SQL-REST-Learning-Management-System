const {
  createEnrollmentSchema,
  createUpdateEnrollmentSchema,
} = require("../validator/enrollmentValidator");
const enrollmentModel = require("../model/enrollmentModel");
const userService = require("./userService");
const redis = require("../cache/redis");

async function enroll(course_id, body) {
  const { _, student_id } = await validateAndEnsureStudentExists(
    createEnrollmentSchema,
    body,
  );
  let enrollment = await enrollmentModel.enroll(course_id, student_id);
  return enrollment;
}

async function unEnroll(course_id, body) {
  const { _, student_id } = await validateAndEnsureStudentExists(
    createEnrollmentSchema,
    body,
  );

  let enrollment = await enrollmentModel.getEnrollment(course_id, student_id);
  if (enrollment == null) {
    throw { status: 404, message: "Enrollment Not Found" };
  } else if (enrollment.status == "rejected") {
    throw { status: 409, message: "Can't delete rejected enrollments" };
  }
  enrollment = await enrollmentModel.unEnroll(course_id, student_id);
  return enrollment;
}
async function updateEnrollment(body, course_id) {
  const { validatedEnrollment, student_id } =
    await validateAndEnsureStudentExists(createUpdateEnrollmentSchema, body);
  const status = validatedEnrollment.status;
  enrollment = await enrollmentModel.getEnrollment(course_id, student_id);

  if (enrollment == null) {
    throw { status: 404, message: "Enrollment Not Found" };
  }
  enrollment = await enrollmentModel.updateEnrollment(
    status,
    course_id,
    student_id,
  );
  return enrollment;
}

async function getEnrollment(body, course_id) {
  const { _, student_id } = await validateAndEnsureStudentExists(
    createEnrollmentSchema,
    body,
  );

  let enrollment = await enrollmentModel.getEnrollment(course_id, student_id);
  if (enrollment == null) {
    throw { status: 404, message: "Enrollment Not Found" };
  }
  return enrollment;
}
async function getAllEnrollments(course_id) {
  let enrollments = await enrollmentModel.getAllEnrollments(course_id);
  return enrollments;
}
async function validateAndEnsureStudentExists(validator, body) {
  const validatedEnrollment = await validator.parse(body);
  const student_id = validatedEnrollment.student_id;
  await userService.assertValidUserId("student", student_id);
  return { validatedEnrollment, student_id };
}
module.exports = {
  enroll,
  unEnroll,
  updateEnrollment,
  getEnrollment,
  getAllEnrollments,
};
