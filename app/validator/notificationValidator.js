const { z } = require("zod");

const createNotificationSchema = z.object({
  user_id: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "user_id is required"
          : "user_id must be string",
    })
    .regex(/^[1-9]\d{0,9}$/, {
      error: (issue) =>
        issue.input.length < 1
          ? "user_id must be at least 1 digit"
          : issue.input.length > 10
            ? "user_id must be at maximum 10 digits"
            : issue.input[0] == "0"
              ? "user_id must be a positive integer"
              : "user_id must be only digits",
    }),
  status: z
    .enum(["read", "unread", "all"], {
      error: (issue) =>
        issue.input === undefined
          ? "status is required"
          : typeof issue.input !== "string"
            ? "status must be string"
            : "status must be one of these [read, unread, all]",
    })
    .optional(),
});

module.exports = { createNotificationSchema };
