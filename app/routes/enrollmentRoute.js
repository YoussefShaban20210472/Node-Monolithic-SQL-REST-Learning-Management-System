// userRoutes.js
const express = require("express");
const enrollmentController = require("../controller/enrollmentController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const {
  validateStudentIDPassedByAdminInstructorMiddleware,
  validateStudentIDPassedByAdminMiddleware,
} = require("../middleware/validateUserIDPassedByAdminMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  validateStudentIDPassedByAdminMiddleware,
  enrollmentController.enroll,
);

router.get(
  "/course/:course_id/enrollment/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  enrollmentController.getAllEnrollments,
);

router.delete(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  validateStudentIDPassedByAdminMiddleware,
  enrollmentController.unEnroll,
);

router.put(
  "/course/:course_id/enrollment",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  validateStudentIDPassedByAdminInstructorMiddleware,
  enrollmentController.updateEnrollment,
);
module.exports = router;
