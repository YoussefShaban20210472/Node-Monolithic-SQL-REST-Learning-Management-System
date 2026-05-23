const lessonService = require("../service/lessonService");

async function ensureLessonExistsMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  let lesson_id = req.params.lesson_id;
  await lessonService.getLesson(course_id, lesson_id);
  next();
}

module.exports = ensureLessonExistsMiddleware;
