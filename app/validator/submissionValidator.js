const { z } = require("zod");

const createSubmissionScoreSchema = z.object({
  score: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "score is required"
          : "score must be floading point",
    })
    .min(0, "score must be at leat 0")
    .max(100, "score must be at most 100"),
});

module.exports = {
  createSubmissionScoreSchema,
};
