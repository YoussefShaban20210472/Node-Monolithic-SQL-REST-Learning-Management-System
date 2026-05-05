const {
  createQuizAttemptSchema,
} = require("../validator/quizAttemptValidator");
const { createEnrollmentSchema } = require("../validator/enrollmentValidator");
const quizAttemptModel = require("../model/quizAttemptModel");
const courseService = require("./courseService");
const quizService = require("./quizService");

function calculateQuizAttemptScore(quizQuestions, answers) {
  let score = 0;
  let sortedQuizQuestions = {};
  for (let quizQuestion of quizQuestions) {
    sortedQuizQuestions[`${quizQuestion.id}`] = {
      score: quizQuestion.score,
      answer: quizQuestion.answer,
    };
  }
  for (let answer of answers) {
    let question = sortedQuizQuestions[`${answer.question_id}`];
    if (question && question.answer === answer.answer) {
      score += question.score;
    }
  }
  return score;
}

async function createQuizAttempt(course_id, quiz_id, body) {
  const validatedQuizAttempt = createQuizAttemptSchema.parse(body);
  const quiz = await quizService.getQuizById(course_id, quiz_id);

  const score = calculateQuizAttemptScore(
    quiz.question,
    validatedQuizAttempt.answer,
  );
  const quizAttemtp = await quizAttemptModel.createQuizAttempt(
    quiz_id,
    validatedQuizAttempt.student_id,
    score,
  );
  return quizAttemtp;
}

async function getQuizAttempt(course_id, quiz_id, body) {
  const { student_id } = createEnrollmentSchema.parse(body);
  const _ = await quizService.getQuizById(course_id, quiz_id);
  const quizAttempt = await quizAttemptModel.getQuizAttempt(
    quiz_id,
    student_id,
  );
  if (quizAttempt == null) {
    throw { status: 404, message: "student didn't solve the quiz yet" };
  }
  return quizAttempt;
}

async function getAllQuizAttempts(course_id, quiz_id) {
  const _ = await quizService.getQuizById(course_id, quiz_id);

  const quizAttempts = await quizAttemptModel.getAllQuizAttempts(quiz_id);
  return quizAttempts;
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
  createQuizAttempt,
  getQuizAttempt,
  getAllQuizAttempts,
  updateQuizById,
};
