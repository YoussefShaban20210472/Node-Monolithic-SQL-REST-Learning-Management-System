// userRoutes.js
const express = require("express");
const questionBankController = require("../controller/questionBankController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/question_bank",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  questionBankController.createQuestionBank,
);
router.delete(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  questionBankController.deleteQuestionBankById,
);

router.get(
  "/course/:course_id/question_bank/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  questionBankController.getAllQuestionsBank,
);

router.get(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  questionBankController.getQuestionBankById,
);
router.put(
  "/course/:course_id/question_bank/:question_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  questionBankController.updateQuestionBankById,
);

module.exports = router;
