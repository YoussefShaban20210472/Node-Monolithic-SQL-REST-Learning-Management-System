const { z } = require("zod");

const createMediaFileSchema = z.object({
  filename: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Filename is required"
          : "Filename must be string",
    })
    .regex(/^.{1,249}\.pdf$/, {
      error: (issue) =>
        issue.input.length < 5
          ? "Filename must be at least 5 letters"
          : issue.input.length > 255
            ? "Filename must be at maximum 255 characters"
            : "Filename must be pdf file",
    }),
});

module.exports = { createMediaFileSchema };
