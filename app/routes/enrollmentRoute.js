// userRoutes.js
const express = require("express");
const enrollmentController = require("../controller/enrollmentController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  enrollmentController.enroll,
);

router.delete(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  enrollmentController.unEnroll,
);

router.put(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  ensureJsonBodyRequestMiddleware,
  enrollmentController.updateEnrollment,
);
module.exports = router;
