// userRoutes.js
const express = require("express");
const quizAttemptController = require("../controller/quizAttemptController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureQuizExistsMiddleware = require("../middleware/ensureQuizExistsMiddleware");
const ensureStudentEnrolledInCourseMiddleware = require("../middleware/ensureStudentEnrolledInCourseMiddleware");
const {
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware,
} = require("../middleware/validateAndAuthorizeStudentIDPassedByAdminMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/quiz/:quiz_id/attempt",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  ensureQuizExistsMiddleware,
  ensureStudentEnrolledInCourseMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  quizAttemptController.createQuizAttempt,
);
router.get(
  "/course/:course_id/quiz/:quiz_id/attempt",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureQuizExistsMiddleware,
  ensureUserInCourseMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware,
  quizAttemptController.getQuizAttempt,
);
router.get(
  "/course/:course_id/quiz/:quiz_id/attempt/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  ensureQuizExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizAttemptController.getAllQuizAttempts,
);

module.exports = router;
