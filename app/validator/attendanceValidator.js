const { z } = require("zod");

function GetIdZObject(name) {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? `${name} is required`
          : `${name} must be string`,
    })
    .regex(/^[1-9]\d{0,9}$/, {
      error: (issue) =>
        issue.input.length < 1
          ? `${name} must be at least 1 digit`
          : issue.input.length > 10
            ? `${name} must be at maximum 10 digits`
            : issue.input[0] == "0"
              ? `${name} must be a positive integer`
              : `${name} must be only digits`,
    });
}

const createAttendanceSchema = z.object({
  student_id: GetIdZObject("student_id"),
  otp: z
    .string({
      error: (issue) =>
        issue.input === undefined ? `otp is required` : `otp must be string`,
    })
    .regex(/^\d{20,255}$/, {
      error: (issue) =>
        issue.input.length < 1
          ? `otp must be at least 20 digit`
          : issue.input.length > 255
            ? `otp must be at maximum 255 digits`
            : `otp must be only digits`,
    }),
});
const createGetAttendanceSchema = z.object({
  student_id: GetIdZObject("student_id"),
});

module.exports = { createAttendanceSchema, createGetAttendanceSchema };
