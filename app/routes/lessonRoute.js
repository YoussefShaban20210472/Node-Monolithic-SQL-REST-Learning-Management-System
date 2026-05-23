// userRoutes.js
const express = require("express");
const lessonController = require("../controller/lessonController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/lesson",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  lessonController.createLesson,
);

router.put(
  "/course/:course_id/lesson/:lesson_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  lessonController.updateLessonById,
);

router.get(
  "/course/:course_id/lesson/all",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  lessonController.getAllLessons,
);
router.delete(
  "/course/:course_id/lesson/:lesson_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  lessonController.deleteLesson,
);

router.get(
  "/course/:course_id/lesson/:lesson_id",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  lessonController.getLesson,
);

router.get(
  "/course/:course_id/lesson/:lesson_id/otp",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  lessonController.getLessonOTP,
);

module.exports = router;
