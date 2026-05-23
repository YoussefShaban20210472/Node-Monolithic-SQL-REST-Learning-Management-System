// userRoutes.js
const express = require("express");
const questionBankController = require("../controller/questionBankController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/question_bank",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  questionBankController.createQuestionBank,
);
router.delete(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  questionBankController.deleteQuestionBankById,
);

router.get(
  "/course/:course_id/question_bank/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  questionBankController.getAllQuestionsBank,
);

router.get(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  questionBankController.getQuestionBankById,
);
router.put(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  questionBankController.updateQuestionBankById,
);

module.exports = router;
