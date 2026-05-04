const quizService = require("../service/quizService");
async function createQuiz(req, res) {
  const course_id = req.params.course_id;
  const body = req.body;
  const quiz = await quizService.createQuiz(course_id, body);
  res.status(201).json({ quiz: quiz });
}
async function deleteQuizById(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  const _ = await quizService.deleteQuizById(course_id, quiz_id);
  res.status(200).json({ message: "quiz deleted successfully" });
}
async function getQuizById(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  const quiz = await quizService.getQuizById(course_id, quiz_id);
  res.status(200).json({ quiz: quiz });
}

async function getAllQuizzes(req, res) {
  const course_id = req.params.course_id;
  const quizzes = await quizService.getAllQuizzes(course_id);
  res.status(200).json({ quizzes: quizzes });
}

async function updateQuizById(req, res) {
  const course_id = req.params.course_id;
  const quiz_id = req.params.quiz_id;
  const body = req.body;

  const _ = await quizService.updateQuizById(course_id, quiz_id, body);
  res.status(200).json({ message: "quiz updated successfully" });
}
module.exports = {
  createQuiz,
  deleteQuizById,
  getQuizById,
  getAllQuizzes,
  updateQuizById,
};
