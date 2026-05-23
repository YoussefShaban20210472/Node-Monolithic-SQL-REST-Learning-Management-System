const { z } = require("zod");
const {
  getStringZObject,
  getNumberZObject,
  getEnumZObject,
  getArrayZObject,
} = require("./validator");
const questionBankSchema = z
  .object({
    question: getStringZObject("question", "10", "500"),
    answer: getStringZObject("answer", "1", "255"),
    score: getNumberZObject("score", 0, 100),
    type: getEnumZObject("type", ["mcq", "true_false", "short_answer"]),
    choice: getArrayZObject("choice", "1", "255", 0, 5),
  })
  .superRefine((data, ctx) => {
    const type = data.type;
    const choice = data.choice;
    const answer = data.answer;

    if (type !== "mcq" && type !== "true_false" && type !== "short_answer") {
      return;
    }
    if (!Array.isArray(choice)) {
      return;
    }
    if (choice.length > 0 && (type == "true_false" || type == "short_answer")) {
      ctx.addIssue({
        code: "custom",
        path: ["choice"],
        message: "choice must be empty if question type is not mcq",
      });
    } else if (choice.length < 2 && type == "mcq") {
      ctx.addIssue({
        code: "custom",
        path: ["choice"],
        message: "choice length must be at least 2 choices",
      });
    } else if (!choice.includes(answer) && type == "mcq") {
      ctx.addIssue({
        code: "custom",
        path: ["choice"],
        message: "choice must contain the correct answer between the choices",
      });
    }
  });

module.exports = { questionBankSchema };
