// userRoutes.js
const express = require("express");
const assignmentMediaFileController = require("../controller/assignmentMediaFileController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const { assignmentUpload } = require("../storage/storage");
const router = express.Router();

router.post(
  "/course/:course_id/assignment/:assignment_id/media_file",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  assignmentUpload.array("files"),
  assignmentMediaFileController.createAssignmentMediaFiles,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  assignmentMediaFileController.deleteAssignmentMediaFile,
);
router.get(
  "/course/:course_id/assignment/:assignment_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  assignmentMediaFileController.getAssignmentMediaFile,
);

module.exports = router;
