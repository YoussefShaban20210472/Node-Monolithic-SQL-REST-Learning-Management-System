const {
  createQuizSchema,
  createUpdateQuizSchema,
  assertValidTimeAndDuration,
} = require("../validator/quizValidator");
const quizModel = require("../model/quizModel");
const questionBankModel = require("../model/questionBankModel");
const courseService = require("./courseService");

async function assertQuestionExist(course_id, questions_ids) {
  for (let question_id of questions_ids) {
    const question = await questionBankModel.getQuestionBankById(
      course_id,
      question_id,
    );
    if (question == null) {
      throw { status: 404, message: "Question not found" };
    }
  }
}

async function createQuiz(course_id, body) {
  const validatedQuiz = await createQuizSchema.parse(body);
  const course = await courseService.getCourseById(course_id);
  await assertValidTimeAndDuration(course, validatedQuiz);
  await assertQuestionExist(course_id, validatedQuiz.question);
  const quiz = await quizModel.createQuiz(course_id, validatedQuiz);
  return quiz;
}

async function deleteQuizById(course_id, quiz_id) {
  const quiz = await quizModel.deleteQuizById(course_id, quiz_id);
  if (quiz == null) {
    throw { status: 404, message: "Quiz not found" };
  }
  return quiz;
}

async function getQuizById(course_id, quiz_id) {
  const quiz = await quizModel.getQuizById(course_id, quiz_id);
  if (quiz == null) {
    throw { status: 404, message: "Quiz not found" };
  }
  return quiz;
}

async function getAllQuizzes(course_id) {
  const quizs = await quizModel.getAllQuizzes(course_id);
  return quizs;
}

async function updateQuizById(course_id, quiz_id, quiz) {
  const validatedQuiz = createUpdateQuizSchema.parse(quiz);

  let safeQuiz = {};
  const safeFields = [
    "title",
    "description",
    "start_date",
    "end_date",
    "question",
  ];
  safeFields.forEach((safeField) => {
    if (validatedQuiz[safeField] != null) {
      safeQuiz[safeField] = validatedQuiz[safeField];
    }
  });
  if (Object.keys(safeQuiz).length === 0) {
    throw {
      status: 400,
      message:
        "You have to provide at least one allowed field to update the quiz",
    };
  }

  const course = await courseService.getCourseById(course_id);
  const oldQuiz = await quizModel.getQuizById(course_id, quiz_id);

  if (validatedQuiz.start_date == null) {
    validatedQuiz.start_date = oldQuiz.start_date;
  }
  if (validatedQuiz.end_date == null) {
    validatedQuiz.end_date = oldQuiz.end_date;
  }

  assertValidTimeAndDuration(course, validatedQuiz);
  delete safeQuiz.question;
  const updatedQuiz = await quizModel.updateQuizById(
    course_id,
    quiz_id,
    safeQuiz,
    validatedQuiz.question,
  );
  if (updatedQuiz == null) {
    throw { status: 404, message: "Quiz Not Found" };
  }

  return updatedQuiz;
}

module.exports = {
  createQuiz,
  deleteQuizById,
  getQuizById,
  getAllQuizzes,
  updateQuizById,
};
