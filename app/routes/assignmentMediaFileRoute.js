// userRoutes.js
const express = require("express");
const assignmentMediaFileController = require("../controller/assignmentMediaFileController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureAssignmentExistsMiddleware = require("../middleware/ensureAssignmentExistsMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const { assignmentUpload } = require("../storage/storage");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const setErrorInsideRequestMiddleware = require("../middleware/setErrorInsideRequestMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/assignment/:assignment_id/media_file",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  setErrorInsideRequestMiddleware,
  assignmentUpload.array("files"),
  assignmentMediaFileController.createAssignmentMediaFiles,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  ensureAssignmentExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentMediaFileController.deleteAssignmentMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/media_file/:filename",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  assignmentMediaFileController.getAssignmentMediaFile,
);

module.exports = router;
