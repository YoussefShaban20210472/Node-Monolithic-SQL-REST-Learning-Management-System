const { z } = require("zod");

const { getStringZObject, getIdZObject } = require("./validator");

const attendanceSchema = z.object({
  student_id: getIdZObject("student_id"),
  otp: getStringZObject("otp", "20", "255", `[0-9]`, "digits"),
});
const getAttendanceSchema = z.object({
  student_id: getIdZObject("student_id"),
});

module.exports = { attendanceSchema, getAttendanceSchema };
