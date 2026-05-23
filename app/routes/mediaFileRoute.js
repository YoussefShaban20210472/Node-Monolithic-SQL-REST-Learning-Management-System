// userRoutes.js
const express = require("express");
const mediaFileController = require("../controller/mediaFileController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const { courseUpload } = require("../storage/storage");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const setErrorInsideRequestMiddleware = require("../middleware/setErrorInsideRequestMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/media_file",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  setErrorInsideRequestMiddleware,
  courseUpload.array("files"),
  mediaFileController.createMediaFiles,
);
router.delete(
  "/course/:course_id/media_file/:filename",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  mediaFileController.deleteMediaFile,
);
router.get(
  "/course/:course_id/media_file/:filename",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  mediaFileController.getMediaFile,
);

module.exports = router;
