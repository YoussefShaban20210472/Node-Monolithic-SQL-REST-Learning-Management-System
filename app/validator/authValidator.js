const { z } = require("zod");

const createAuthSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "email is required"
          : "email must be string",
    })
    .min(1, "email is required"),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "password is required"
          : "password must be string",
    })
    .min(1, "password is required"),
});

module.exports = createAuthSchema;
