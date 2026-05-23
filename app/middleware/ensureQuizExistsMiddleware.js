const quizService = require("../service/quizService");

async function ensureQuizExistsMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  let quiz_id = req.params.quiz_id;
  await quizService.getQuizById(course_id, quiz_id);
  next();
}

module.exports = ensureQuizExistsMiddleware;
