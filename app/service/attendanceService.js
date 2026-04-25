const {
  createAttendanceSchema,
  createGetAttendanceSchema,
} = require("../validator/attendanceValidator");

const attendanceModel = require("../Model/attendanceModel");
const userService = require("./userService");
const lessonService = require("./lessonService");
const redis = require("../Cache/redis");

async function attend(course_id, lesson_id, body) {
  const validatedAttendance = createAttendanceSchema.parse(body);
  const student_id = validatedAttendance.student_id;
  const otp = validatedAttendance.otp;

  const lesson = await lessonService.getLessonOTP(course_id, lesson_id);
  await userService.assertValidUserId("student", student_id);
  if (lesson.otp != otp) {
    throw { status: 400, message: "Wrong OTP" };
  }

  let attendance = await attendanceModel.attend(lesson_id, student_id);
  return attendance;
}

async function getAttendance(course_id, lesson_id, body) {
  const validatedAttendance = createGetAttendanceSchema.parse(body);
  const student_id = validatedAttendance.student_id;

  await lessonService.getLessonOTP(course_id, lesson_id);
  await userService.assertValidUserId("student", student_id);

  let attendance = await attendanceModel.getAttendance(lesson_id, student_id);
  if (attendance == null) {
    throw { status: 404, message: "Attendance is not found" };
  }
  return attendance;
}
async function getAllAttendances(course_id, lesson_id) {
  await lessonService.getLessonOTP(course_id, lesson_id);

  let attendances = await attendanceModel.getAllAttendances(lesson_id);
  return attendances;
}

module.exports = {
  attend,
  getAttendance,
  getAllAttendances,
};
