// userRoutes.js
const express = require("express");
const courseController = require("../controller/courseController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const {
  validateInstructorIDPassedByAdminMiddleware,
} = require("../middleware/validateUserIDPassedByAdminMiddleware");
const router = express.Router();

router.post(
  "/course",
  authorizeAdminInstructorMiddleware,
  validateInstructorIDPassedByAdminMiddleware,
  courseController.createCourse,
);

router.get("/course/all", courseController.getAllFullCourses);
router.get(
  "/course/:course_id",
  idFormatMiddleware,
  authorizeInstructorOwnershipMiddleware,
  courseController.GetFullCourseById,
);

router.put(
  "/course/:course_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  courseController.updateCourseById,
);

router.delete(
  "/course/:course_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  courseController.deleteCourseById,
);
module.exports = router;
