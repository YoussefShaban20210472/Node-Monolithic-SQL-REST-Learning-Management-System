const lessonService = require("../service/lessonService");
const userService = require("../service/userService");
async function createLesson(req, res) {
  const course_id = req.params.course_id;
  const body = req.body;
  const lesson = await lessonService.createLesson(course_id, body);
  res.status(201).json({ lesson });
}
async function deleteLesson(req, res) {
  const course_id = req.params.course_id;
  const lesson_id = req.params.lesson_id;
  const _ = await lessonService.deleteLesson(course_id, lesson_id);
  res.status(200).json({ message: "lesson deleted successfully" });
}
async function getLesson(req, res) {
  const course_id = req.params.course_id;
  const lesson_id = req.params.lesson_id;
  const lesson = await lessonService.getLesson(course_id, lesson_id);
  res.status(200).json({ lesson });
}
async function getLessonOTP(req, res) {
  const course_id = req.params.course_id;
  const lesson_id = req.params.lesson_id;
  const lesson = await lessonService.getLessonOTP(course_id, lesson_id);
  res.status(200).json({ lesson });
}

async function getAllLessons(req, res) {
  const course_id = req.params.course_id;
  const lessons = await lessonService.getAllLessons(course_id);
  res.status(200).json({ lessons });
}

async function updateLessonById(req, res) {
  const course_id = req.params.course_id;
  const lesson_id = req.params.lesson_id;
  const body = req.body;

  const _ = await lessonService.updateLessonById(course_id, lesson_id, body);
  res.status(200).json({ message: "lesson updated successfully" });
}
module.exports = {
  createLesson,
  deleteLesson,
  getLesson,
  getLessonOTP,
  getAllLessons,
  updateLessonById,
};
