// userRoutes.js
const express = require("express");
const quizAttemptController = require("../controller/quizAttemptController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/quiz/:quiz_id/attempt",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureUserInCourseMiddleware,
  ensureCourseExistsMiddleware,
  quizAttemptController.createQuizAttempt,
);
router.get(
  "/course/:course_id/quiz/:quiz_id/attempt",
  idFormatMiddleware,
  ensureUserInCourseMiddleware,
  ensureCourseExistsMiddleware,
  quizAttemptController.getQuizAttempt,
);
router.get(
  "/course/:course_id/quiz/:quiz_id/attempt/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizAttemptController.getAllQuizAttempts,
);

// router.get(
//   "/course/:course_id/lesson/:lesson_id/attendance",
//   idFormatMiddleware,
//   ensureUserInCourseMiddleware,
//   attendanceController.getAttendance,
// );
// router.get(
//   "/course/:course_id/lesson/:lesson_id/attendance/all",
//   idFormatMiddleware,
//   authorizeAdminInstructorMiddleware,
//   authorizeInstructorOwnershipMiddleware,
//   attendanceController.getAllAttendances,
// );

module.exports = router;
