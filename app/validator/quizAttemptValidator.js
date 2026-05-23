const { z } = require("zod");
const {
  getStringZObject,
  getNumberZObject,
  getEnumZObject,
  getArrayZObject,
  getIdZObject,
} = require("./validator");

const quizAttemptSchema = z.object({
  student_id: getIdZObject("student_id"),
  answer: z.array(
    z.object({
      question_id: getIdZObject("question_id"),
      answer: getStringZObject("question answer", "1", "255"),
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
  quizAttemptSchema,
};
