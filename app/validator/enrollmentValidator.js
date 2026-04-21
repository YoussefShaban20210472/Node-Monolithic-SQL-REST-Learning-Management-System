const { z } = require("zod");
const student_id = {
  student_id: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "student_id is required"
          : "student_id must be string",
    })
    .regex(/^[1-9]\d{0,9}$/, {
      error: (issue) =>
        issue.input.length < 1
          ? "student_id must be at least 1 digit"
          : issue.input.length > 10
            ? "student_id must be at maximum 10 digits"
            : issue.input[0] == "0"
              ? "student_id must be a positive integer"
              : "student_id must be only digits",
    }),
};
const createEnrollmentSchema = z.object(student_id);
const createUpdateEnrollmentSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    error: (issue) =>
      issue.input === undefined
        ? "status is required"
        : typeof issue.input !== "string"
          ? "status must be string"
          : "status must be accepted or rejected",
  }),
  ...student_id,
});

module.exports = { createEnrollmentSchema, createUpdateEnrollmentSchema };
