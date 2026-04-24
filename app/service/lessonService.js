const {
  createLessonSchema,
  createUpdateLessonSchema,
  assertValidTimeAndDuration,
} = require("../validator/lessonValidator");
const lessonModel = require("../model/lessonModel");
const courseService = require("./courseService");
const generateOTP = require("../utils/otp");

async function createLesson(course_id, body) {
  const validatedLesson = await createLessonSchema.parse(body);
  const course = await courseService.getCourseById(course_id);
  await assertValidTimeAndDuration(course, validatedLesson);
  validatedLesson["otp"] = generateOTP();
  const lesson = await lessonModel.createLesson(course_id, validatedLesson);
  return lesson;
}

async function deleteLesson(course_id, lesson_id) {
  const lesson = await lessonModel.deleteLesson(course_id, lesson_id);
  if (lesson == null) {
    throw { status: 404, message: "Lesson not found" };
  }
  return lesson;
}
async function getLesson(course_id, lesson_id) {
  const lesson = await lessonModel.getLesson(course_id, lesson_id);
  if (lesson == null) {
    throw { status: 404, message: "Lesson not found" };
  }
  return lesson;
}
async function getLessonOTP(course_id, lesson_id) {
  const lesson = await lessonModel.getLessonOTP(course_id, lesson_id);
  if (lesson == null) {
    throw { status: 404, message: "Lesson not found" };
  }
  return lesson;
}
async function getAllLessons(course_id) {
  const lessons = await lessonModel.getAllLessons(course_id);
  return lessons;
}

async function updateLessonById(course_id, lesson_id, lesson) {
  // Validate lesson
  // Schema Validation
  const validatedLesson = createUpdateLessonSchema.parse(lesson);

  let safeLesson = {};
  const safeFields = ["title", "description", "start_date", "end_date"];
  safeFields.forEach((safeField) => {
    if (validatedLesson[safeField] != null) {
      safeLesson[safeField] = validatedLesson[safeField];
    }
  });
  if (Object.keys(safeLesson).length === 0) {
    throw {
      status: 400,
      message:
        "You have to provide at least one allowed field to update the lesson",
    };
  }

  const course = await courseService.getCourseById(course_id);
  const oldLesson = await lessonModel.getLesson(course_id, lesson_id);

  if (validatedLesson.start_date == null) {
    validatedLesson.start_date = oldLesson.start_date;
  }
  if (validatedLesson.end_date == null) {
    validatedLesson.end_date = oldLesson.end_date;
  }

  assertValidTimeAndDuration(course, validatedLesson);

  const updatedLesson = await lessonModel.updateLessonById(
    course_id,
    lesson_id,
    safeLesson,
  );
  if (updatedLesson == null) {
    throw { status: 404, message: "Lesson Not Found" };
  }

  return updatedLesson;
}

module.exports = {
  createLesson,
  deleteLesson,
  getLesson,
  getLessonOTP,
  getAllLessons,
  updateLessonById,
};
