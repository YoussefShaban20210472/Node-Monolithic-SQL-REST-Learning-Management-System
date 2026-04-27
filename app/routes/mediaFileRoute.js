// userRoutes.js
const express = require("express");
const mediaFileController = require("../controller/mediaFileController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const { courseUpload } = require("../storage/storage");
const router = express.Router();

router.post(
  "/course/:course_id/media_file",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  courseUpload.array("files"),
  mediaFileController.createMediaFiles,
);
router.delete(
  "/course/:course_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  mediaFileController.deleteMediaFile,
);
router.get(
  "/course/:course_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureCourseExistsMiddleware,
  mediaFileController.getMediaFile,
);

module.exports = router;
