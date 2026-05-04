const {
  createQuestionBankSchema,
} = require("../validator/questionBankValidator");
const questionBankModel = require("../model/questionBankModel");

async function createQuestionBank(course_id, body) {
  const validatedQuestionBank = await createQuestionBankSchema.parse(body);

  const questionBank = await questionBankModel.createQuestionBank(
    course_id,
    validatedQuestionBank,
  );
  return questionBank;
}

async function deleteQuestionBankById(course_id, question_id) {
  const questionBank = await questionBankModel.deleteQuestionBankById(
    course_id,
    question_id,
  );
  if (questionBank == null) {
    throw { status: 404, message: "question bank not found" };
  }
  return questionBank;
}
async function getQuestionBankById(course_id, question_id) {
  const questionBank = await questionBankModel.getQuestionBankById(
    course_id,
    question_id,
  );
  if (questionBank == null) {
    throw { status: 404, message: "question bank not found" };
  }
  return questionBank;
}

async function getAllQuestionsBank(course_id) {
  const questionsBank = await questionBankModel.getAllQuestionsBank(course_id);
  return questionsBank;
}

async function updateQuestionBankById(course_id, question_id, body) {
  if (body == null || Array.isArray(body) || typeof body != "object") {
    throw {
      status: 400,
      message: "Body must be Body must be a JSON object",
    };
  }

  let safeQuestionBank = {};
  const safeFields = ["question", "answer", "score", "type", "choice"];
  safeFields.forEach((safeField) => {
    if (body[safeField] != null) {
      safeQuestionBank[safeField] = body[safeField];
    }
  });
  if (Object.keys(safeQuestionBank).length === 0) {
    throw {
      status: 400,
      message:
        "You have to provide at least one allowed field to update the question",
    };
  }

  const questionBank = await getQuestionBankById(course_id, question_id);
  safeFields.forEach((safeField) => {
    if (body[safeField] == null) {
      safeQuestionBank[safeField] = questionBank[safeField];
    }
  });

  const validatedQuestionBank =
    await createQuestionBankSchema.parse(safeQuestionBank);
  delete validatedQuestionBank.choice;
  const updateQuestionBank = await questionBankModel.updateQuestionBankById(
    course_id,
    question_id,
    validatedQuestionBank,
    body.choice,
  );

  return updateQuestionBank;
}

module.exports = {
  createQuestionBank,
  deleteQuestionBankById,
  getQuestionBankById,
  getAllQuestionsBank,
  updateQuestionBankById,
};
