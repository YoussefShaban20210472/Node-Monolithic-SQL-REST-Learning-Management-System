// userRoutes.js
const express = require("express");
const quizController = require("../controller/quizController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/quiz",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizController.createQuiz,
);
router.delete(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizController.deleteQuizById,
);

router.get(
  "/course/:course_id/quiz/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizController.getAllQuizzes,
);

router.get(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizController.getQuizById,
);
router.put(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  quizController.updateQuizById,
);

module.exports = router;
