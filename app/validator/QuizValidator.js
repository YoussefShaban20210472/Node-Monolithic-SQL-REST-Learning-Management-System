const { z } = require("zod");

const HALF_HOUR = 1000 * 60 * 30;
const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = 7 * ONE_DAY;
const ONE_YEAR = 365 * ONE_DAY;

function assertValidTimeAndDuration(course, quiz) {
  const course_start_date = new Date(course.start_date);
  const course_end_date = new Date(course.end_date);
  const quiz_start_date = new Date(quiz.start_date);
  const quiz_end_date = new Date(quiz.end_date);
  let message = undefined;
  if (quiz_start_date < course_start_date) {
    message = "Quiz start date must start after course start date";
  } else if (quiz_start_date >= course_end_date) {
    message = "Quiz start date must start before course end date";
  } else if (quiz_end_date > course_end_date) {
    message = "Quiz end date must end before course end date";
  }
  if (message) {
    throw { status: 400, message };
  }
}

const createQuizSchema = z
  .object({
    title: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "title is required"
            : "title must be string",
      })
      .regex(/^[A-Za-z]{5,255}$/, {
        error: (issue) =>
          issue.input.length < 5
            ? "title must be at least 5 letters"
            : issue.input.length > 255
              ? "title must be at maximum 255 letters"
              : "title must be only letters",
      }),
    description: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "description is required"
            : "description must be string",
      })
      .regex(/^[A-Za-z]{20,}$/, {
        error: (issue) =>
          issue.input.length < 3
            ? "description must be at least 20 letters"
            : "description must be only letters",
      }),
    start_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "start_date is required"
            : "start_date must be string",
      })
      .datetime("start_date must be valid ISO datetime string")
      .refine(
        (time) => {
          const date = new Date(time);
          const now = new Date();
          return date >= now;
        },
        {
          message: "start_date must be at least now",
        },
      ),
    end_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "end_date is required"
            : "end_date must be string",
      })
      .datetime("end_date must be valid ISO datetime string"),
    question: z
      .array(
        z
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
        {
          error: (issue) =>
            issue.input === undefined
              ? "question is required"
              : "question must be array",
        },
      )
      .min(1, "You can add at least 1 question"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.start_date).getTime();
    const end = new Date(data.end_date).getTime();

    // ✅ validate both dates first
    if (isNaN(start) || isNaN(end)) {
      return;
    }
    const diff = end - start;

    if (diff < HALF_HOUR) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at least 30 minutes after start_date",
      });
    }

    if (diff > ONE_YEAR) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at most 1 year after start_date",
      });
    }
  });
const createUpdateQuizSchema = z
  .object({
    title: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "title is required"
            : "title must be string",
      })
      .regex(/^[A-Za-z]{5,255}$/, {
        error: (issue) =>
          issue.input.length < 5
            ? "title must be at least 5 letters"
            : issue.input.length > 255
              ? "title must be at maximum 255 letters"
              : "title must be only letters",
      })
      .optional(),
    description: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "description is required"
            : "description must be string",
      })
      .regex(/^[A-Za-z]{20,}$/, {
        error: (issue) =>
          issue.input.length < 3
            ? "description must be at least 20 letters"
            : "description must be only letters",
      })
      .optional(),
    start_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "start_date is required"
            : "start_date must be string",
      })
      .datetime("start_date must be valid ISO datetime string")
      .refine(
        (time) => {
          const date = new Date(time);
          const now = new Date();
          return date >= now;
        },
        {
          message: "start_date must be at least now",
        },
      )
      .optional(),
    end_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "end_date is required"
            : "end_date must be string",
      })
      .datetime("end_date must be valid ISO datetime string")
      .optional(),
    question: z
      .array(
        z
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
        {
          error: (issue) =>
            issue.input === undefined
              ? "question is required"
              : "question must be array",
        },
      )
      .min(1, "You can add at least 1 question")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.start_date).getTime();
    const end = new Date(data.end_date).getTime();

    // ✅ validate both dates first
    if (isNaN(start) || isNaN(end)) {
      return;
    }
    const diff = end - start;

    if (diff < HALF_HOUR) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at least 30 minutes after start_date",
      });
    }

    if (diff > ONE_YEAR) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at most 1 year after start_date",
      });
    }
  });

module.exports = {
  createQuizSchema,
  createUpdateQuizSchema,
  assertValidTimeAndDuration,
};
