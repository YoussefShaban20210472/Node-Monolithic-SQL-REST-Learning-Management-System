// userRoutes.js
const express = require("express");
const quizController = require("../controller/quizController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/quiz",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizController.createQuiz,
);
router.delete(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizController.deleteQuizById,
);

router.get(
  "/course/:course_id/quiz/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizController.getAllQuizzes,
);

router.get(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizController.getQuizById,
);
router.put(
  "/course/:course_id/quiz/:quiz_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  quizController.updateQuizById,
);

module.exports = router;
