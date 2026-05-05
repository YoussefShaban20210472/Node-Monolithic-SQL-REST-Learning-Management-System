const { z } = require("zod");

const createQuizAttemptSchema = z.object({
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
  answer: z.array(
    z.object({
      question_id: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "question_id is required"
              : "question_id must be string",
        })
        .regex(/^[1-9]\d{0,9}$/, {
          error: (issue) =>
            issue.input.length < 1
              ? "question_id must be at least 1 digit"
              : issue.input.length > 10
                ? "question_id must be at maximum 10 digits"
                : issue.input[0] == "0"
                  ? "question_id must be a positive integer"
                  : "question_id must be only digits",
        }),
      answer: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "question answer is required"
              : "question answer must be string",
        })
        .regex(/^[A-Za-z]{1,255}$/, {
          error: (issue) =>
            issue.input.length < 20
              ? "question answer must be at least 1 letters"
              : issue.input.length > 255
                ? "question answer must be at maximum 255 letters"
                : "question answer must be only letters",
        }),
    }),
    {
      error: (issue) =>
        issue.input === undefined
          ? "answer is required"
          : "answer must be array",
    },
  ),
});

module.exports = {
  createQuizAttemptSchema,
};
