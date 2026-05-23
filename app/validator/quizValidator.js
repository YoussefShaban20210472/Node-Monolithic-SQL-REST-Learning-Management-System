const { z } = require("zod");
const {
  HALF_HOUR,
  ONE_DAY,
  SEVEN_DAYS,
  ONE_YEAR,
  getStringZObject,
  getDateZObject,
  getNumberZObject,
  checkDuration,
  checkTimeNow,
  getIdZObject,
} = require("./validator");

const quizSchema = z
  .object({
    title: getStringZObject("title", "5", "255"),
    description: getStringZObject("description", "20", "99999999999"),
    start_date: getDateZObject("start_date").refine(checkTimeNow, {
      message: "start_date must be at least now",
    }),
    end_date: getDateZObject("end_date"),
    question: z
      .array(getIdZObject("question_id"), {
        error: (issue) =>
          issue.input === undefined
            ? "question is required"
            : "question must be array",
      })
      .min(1, "You can add at least 1 question"),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "minutes"));
const updateQuizSchema = z
  .object({
    title: getStringZObject("title", "5", "255").optional(),
    description: getStringZObject(
      "description",
      "20",
      "99999999999",
    ).optional(),
    start_date: getDateZObject("start_date")
      .refine(checkTimeNow, {
        message: "start_date must be at least now",
      })
      .optional(),
    end_date: getDateZObject("end_date").optional(),
    question: z
      .array(getIdZObject("question_id"), {
        error: (issue) =>
          issue.input === undefined
            ? "question is required"
            : "question must be array",
      })
      .min(1, "You can add at least 1 question")
      .optional(),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "minutes"));

module.exports = {
  quizSchema,
  updateQuizSchema,
};
