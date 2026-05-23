// userRoutes.js
const express = require("express");
const attendanceController = require("../controller/attendanceController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureLessonExistsMiddleware = require("../middleware/ensureLessonExistsMiddleware");
const ensureStudentEnrolledInCourseMiddleware = require("../middleware/ensureStudentEnrolledInCourseMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const {
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware,
} = require("../middleware/validateAndAuthorizeStudentIDPassedByAdminMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/lesson/:lesson_id/attendance",
  idFormatMiddleware,
  authorizeAdminStudentMiddleware,
  ensureCourseExistsMiddleware,
  ensureLessonExistsMiddleware,
  ensureStudentEnrolledInCourseMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminMiddleware,
  attendanceController.attend,
);

router.get(
  "/course/:course_id/lesson/:lesson_id/attendance",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureLessonExistsMiddleware,
  ensureUserInCourseMiddleware,
  validateAndAuthorizeStudentIDPassedByAdminInstructorMiddleware,
  attendanceController.getAttendance,
);
router.get(
  "/course/:course_id/lesson/:lesson_id/attendance/all",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  ensureLessonExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  attendanceController.getAllAttendances,
);

module.exports = router;
