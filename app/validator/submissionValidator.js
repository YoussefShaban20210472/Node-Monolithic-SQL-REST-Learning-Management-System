const { z } = require("zod");
const { getNumberZObject } = require("./validator");
const submissionScoreSchema = z.object({
  score: getNumberZObject("score", 0, 100),
});

module.exports = {
  submissionScoreSchema,
};
