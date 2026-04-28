// userRoutes.js
const express = require("express");
const submissionMediaFileController = require("../controller/submissionMediaFileController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const authorizeStudentSubmissionOwnershipMiddleware = require("../middleware/authorizeStudentSubmissionOwnershipMiddleware");
const { submissionUpload } = require("../storage/storage");
const router = express.Router();

router.post(
  "/course/:course_id/assignment/:assignment_id/submission",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  submissionUpload.array("files"),
  submissionMediaFileController.createSubmissionMediaFiles,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.deleteSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id/media_file/:filename",
  idFormatMiddleware,
  authorizeInstructorOwnershipMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  authorizeInstructorOwnershipMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmission,
);
router.patch(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  submissionMediaFileController.updateSubmissionScore,
);

module.exports = router;
