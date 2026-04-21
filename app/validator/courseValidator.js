const { z } = require("zod");

const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = 7 * ONE_DAY;
const ONE_YEAR = 365 * ONE_DAY;
function checkTime(time) {
  const date = new Date(time);
  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + ONE_YEAR);

  return date >= now && date <= oneYearFromNow;
}

const createCourseSchema = z
  .object({
    instructor_id: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "instructor_id is required"
            : "instructor_id must be string",
      })
      .regex(/^[1-9]\d{0,9}$/, {
        error: (issue) =>
          issue.input.length < 1
            ? "instructor_id must be at least 1 digit"
            : issue.input.length > 10
              ? "instructor_id must be at maximum 10 digits"
              : issue.input[0] == "0"
                ? "instructor_id must be a positive integer"
                : "instructor_id must be only digits",
      }),
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
    short_description: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "short_description is required"
            : "short_description must be string",
      })
      .regex(/^[A-Za-z]{20,500}$/, {
        error: (issue) =>
          issue.input.length < 20
            ? "short_description must be at least 20 letters"
            : issue.input.length > 500
              ? "short_description must be at maximum 500 letters"
              : "short_description must be only letters",
      }),
    start_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "start_date is required"
            : "start_date must be string",
      })
      .datetime("start_date must be valid ISO datetime string")
      .refine(checkTime, {
        message: "start_date must be between now and one year from now",
      }),
    end_date: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "end_date is required"
            : "end_date must be string",
      })
      .datetime("end_date must be valid ISO datetime string"),
    tag: z
      .array(
        z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "tag element is required"
                : "tag element must be string",
          })
          .regex(
            /^[A-Za-z]{1,255}$/,
            {
              error: (issue) =>
                issue.input.length < 1
                  ? "tag element must be at least 5 letters"
                  : issue.input.length > 255
                    ? "tag element must be at maximum 255 letters"
                    : "tag element must be only letters",
            },
            {
              error: (issue) =>
                issue.input === undefined
                  ? "tag is required"
                  : "tag element must be array",
            },
          ),
      )
      .min(1, "You have to add at least one tag"),
    category: z
      .array(
        z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "category element is required"
                : "category element must be string",
          })
          .regex(
            /^[A-Za-z]{1,255}$/,
            {
              error: (issue) =>
                issue.input.length < 1
                  ? "category element must be at least 5 letters"
                  : issue.input.length > 255
                    ? "category element must be at maximum 255 letters"
                    : "category element must be only letters",
            },
            {
              error: (issue) =>
                issue.input === undefined
                  ? "category is required"
                  : "category element must be array",
            },
          ),
      )
      .min(1, "You have to add at least one category"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.start_date).getTime();
    const end = new Date(data.end_date).getTime();

    // ✅ validate both dates first
    if (isNaN(start) || isNaN(end)) {
      return;
    }
    const diff = end - start;

    if (diff < SEVEN_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at least 7 days after start_date",
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

const createUpdateCourseSchema = z
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
    short_description: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "short_description is required"
            : "short_description must be string",
      })
      .regex(/^[A-Za-z]{20,500}$/, {
        error: (issue) =>
          issue.input.length < 20
            ? "short_description must be at least 20 letters"
            : issue.input.length > 500
              ? "short_description must be at maximum 500 letters"
              : "short_description must be only letters",
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
      .refine(checkTime, {
        message: "start_date must be between now and one year from now",
      })
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
    tag: z
      .array(
        z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "tag element is required"
                : "tag element must be string",
          })
          .regex(
            /^[A-Za-z]{1,255}$/,
            {
              error: (issue) =>
                issue.input.length < 1
                  ? "tag element must be at least 5 letters"
                  : issue.input.length > 255
                    ? "tag element must be at maximum 255 letters"
                    : "tag element must be only letters",
            },
            {
              error: (issue) =>
                issue.input === undefined
                  ? "tag is required"
                  : "tag element must be array",
            },
          ),
      )
      .min(1, "You have to add at least one tag")
      .optional(),
    category: z
      .array(
        z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "category element is required"
                : "category element must be string",
          })
          .regex(
            /^[A-Za-z]{1,255}$/,
            {
              error: (issue) =>
                issue.input.length < 1
                  ? "category element must be at least 5 letters"
                  : issue.input.length > 255
                    ? "category element must be at maximum 255 letters"
                    : "category element must be only letters",
            },
            {
              error: (issue) =>
                issue.input === undefined
                  ? "category is required"
                  : "category element must be array",
            },
          ),
      )
      .min(1, "You have to add at least one category")
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

    if (diff < SEVEN_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be at least 7 days after start_date",
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
module.exports = { createCourseSchema, createUpdateCourseSchema };
