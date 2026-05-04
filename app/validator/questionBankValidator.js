const { z } = require("zod");

const createQuestionBankSchema = z
  .object({
    question: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "question is required"
            : "question must be string",
      })
      .regex(/^[A-Za-z]{10,500}$/, {
        error: (issue) =>
          issue.input.length < 10
            ? "question must be at least 10 letters"
            : issue.input.length > 500
              ? "question must be at maximum 500 letters"
              : "question must be only letters",
      }),

    answer: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "answer is required"
            : "answer must be string",
      })
      .regex(/^[A-Za-z]{1,255}$/, {
        error: (issue) =>
          issue.input.length < 20
            ? "answer must be at least 20 letters"
            : issue.input.length > 255
              ? "answer must be at maximum 255 letters"
              : "answer must be only letters",
      }),
    score: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "score is required"
            : "score must be floading point",
      })
      .min(0, "score must be at leat 0")
      .max(100, "score must be at most 100"),
    type: z.enum(["mcq", "true_false", "short_answer"], {
      error: (issue) =>
        issue.input === undefined
          ? "type is required"
          : typeof issue.input !== "string"
            ? "type must be string"
            : "type must be one of these [mcq, true_false, short_answer]",
    }),

    choice: z
      .array(
        z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "choice element is required"
                : "choice element must be string",
          })
          .regex(/^[A-Za-z]{1,255}$/, {
            error: (issue) =>
              issue.input.length < 1
                ? "choice element must be at least 1 letters"
                : issue.input.length > 255
                  ? "choice element must be at maximum 255 letters"
                  : "choice element must be only letters",
          }),
        {
          error: (issue) =>
            issue.input === undefined
              ? "choice is required"
              : "choice must be array",
        },
      )
      .max(5, "You can add at most 5 choices"),
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

module.exports = { createQuestionBankSchema };
