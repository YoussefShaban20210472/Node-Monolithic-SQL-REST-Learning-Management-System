const quizAttemptService = require("../service/quizAttemptService");
async function createQuizAttempt(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  const body = req.body;
  try {
    if (req.user.role == "student") {
      body["student_id"] = req.user.id;
    }
  } catch {}

  const quizAttempt = await quizAttemptService.createQuizAttempt(
    course_id,
    quiz_id,
    body,
  );
  res.status(200).json(quizAttempt);
}
async function getQuizAttempt(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  let body = req.body;
  try {
    if (req.user.role == "student") {
      body = {};
      body["student_id"] = req.user.id;
    }
  } catch {}

  const quizAttempt = await quizAttemptService.getQuizAttempt(
    course_id,
    quiz_id,
    body,
  );
  res.status(200).json(quizAttempt);
}

async function getAllQuizAttempts(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  const quizAttempts = await quizAttemptService.getAllQuizAttempts(
    course_id,
    quiz_id,
  );
  res.status(200).json({ attempts: quizAttempts });
}

module.exports = {
  createQuizAttempt,
  getQuizAttempt,
  getAllQuizAttempts,
  // deleteQuizById,
  // getQuizById,
  // getAllQuizzes,
  // updateQuizById,
};
