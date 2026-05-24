const { updateEnrollmentSchema } = require("../validator/enrollmentValidator");
const enrollmentModel = require("../model/enrollmentModel");
const userService = require("./userService");
const { ObjectNotFound, Confilct } = require("../error/businessError");

async function enroll(course_id, body) {
  const student_id = body.student_id;
  let enrollment = await enrollmentModel.enroll(course_id, student_id);
  return enrollment;
}

async function unEnroll(course_id, body) {
  const student_id = body.student_id;

  let enrollment = await enrollmentModel.getEnrollment(course_id, student_id);
  if (enrollment == null) {
    throw new ObjectNotFound("Enrollment");
  } else if (enrollment.status == "rejected") {
    throw new Confilct("Can't delete rejected enrollments");
  }
  enrollment = await enrollmentModel.unEnroll(course_id, student_id);
  return enrollment;
}
async function updateEnrollment(body, course_id) {
  const student_id = body.student_id;
  const validatedEnrollment = updateEnrollmentSchema.parse(body);

  const status = validatedEnrollment.status;
  enrollment = await enrollmentModel.getEnrollment(course_id, student_id);

  if (enrollment == null) {
    throw new ObjectNotFound("Enrollment");
  }
  enrollment = await enrollmentModel.updateEnrollment(
    status,
    course_id,
    student_id,
  );
  return enrollment;
}

async function getEnrollment(body, course_id) {
  const student_id = body.student_id;

  let enrollment = await enrollmentModel.getEnrollment(course_id, student_id);
  if (enrollment == null) {
    throw new ObjectNotFound("Enrollment");
  }
  return enrollment;
}
async function getAllEnrollments(course_id) {
  let enrollments = await enrollmentModel.getAllEnrollments(course_id);
  return enrollments;
}

module.exports = {
  enroll,
  unEnroll,
  updateEnrollment,
  getEnrollment,
  getAllEnrollments,
};
