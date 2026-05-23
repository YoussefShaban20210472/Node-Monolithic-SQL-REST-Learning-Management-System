// userRoutes.js
const express = require("express");
const submissionMediaFileController = require("../controller/submissionMediaFileController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureAssignmentExistsMiddleware = require("../middleware/ensureAssignmentExistsMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const ensureStudentEnrolledInCourseMiddleware = require("../middleware/ensureStudentEnrolledInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const authorizeStudentSubmissionOwnershipMiddleware = require("../middleware/authorizeStudentSubmissionOwnershipMiddleware");
const {
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
} = require("../middleware/validateAndAuthorizeStudentIDPassedByAdminMiddleware");
const { submissionUpload } = require("../storage/storage");
const setErrorInsideRequestMiddleware = require("../middleware/setErrorInsideRequestMiddleware");
const badSolutionForSubmissionMiddleware = require("../middleware/badSolutionForSubmissionMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/assignment/:assignment_id/submission",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  ensureStudentEnrolledInCourseMiddleware,
  badSolutionForSubmissionMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  setErrorInsideRequestMiddleware,
  submissionUpload.array("files"),
  badSolutionForSubmissionMiddleware,
  submissionMediaFileController.createSubmissionMediaFiles,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  ensureStudentEnrolledInCourseMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.deleteSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id/media_file/:filename",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  ensureUserInCourseMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmissionMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  ensureUserInCourseMiddleware,
  authorizeStudentSubmissionOwnershipMiddleware,
  submissionMediaFileController.getSubmission,
);
router.patch(
  "/course/:course_id/assignment/:assignment_id/submission/:submission_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  submissionMediaFileController.updateSubmissionScore,
);

module.exports = router;
