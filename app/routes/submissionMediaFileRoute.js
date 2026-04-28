// userRoutes.js
const express = require("express");
const submissionMediaFileController = require("../controller/submissionMediaFileController");
const authorizeAdminStudentmiddleware = require("../middleware/authorizeAdminStudentmiddleware");
const authorizeAdminInstructormiddleware = require("../middleware/authorizeAdminInstructormiddleware");
const authorizeInstructorOwnershipmiddleware = require("../middleware/authorizeInstructorOwnershipmiddleware");
const ensureCourseExistsmiddleware = require("../middleware/ensureCourseExistsmiddleware");
const ensureJsonBodyRequestmiddleware = require("../middleware/ensureJsonBodyRequestmiddleware");
const ensureUserInCoursemiddleware = require("../middleware/ensureUserInCoursemiddleware");
const idFormatmiddleware = require("../middleware/idFormatmiddleware");
const authorizeStudentSubmissionOwnershipMiddleware = require("../middleware/authorizeStudentSubmissionOwnershipMiddleware");
const { submissionUpload } = require("../storage/storage");
const router = express.Router();

router.post(
  "/course/:course_id/assignment/:assignment_id/submission",
  idFormatmiddleware,
  authorizeAdminStudentmiddleware,
  authorizeInstructorOwnershipmiddleware,
  ensureCourseExistsmiddleware,
  submissionUpload.array("files"),
  submissionMediaFileController.createSubmissionMediaFiles,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatmiddleware,
  authorizeAdminStudentmiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.deleteSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id/media_file/:filename",
  idFormatmiddleware,
  authorizeInstructorOwnershipmiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatmiddleware,
  authorizeInstructorOwnershipmiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmission,
);
router.patch(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatmiddleware,
  authorizeAdminInstructormiddleware,
  authorizeInstructorOwnershipmiddleware,
  submissionMediaFileController.updateSubmissionScore,
);

module.exports = router;
