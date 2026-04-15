// userRoutes.js
const express = require("express");
const courseController = require("../controller/courseController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course",
  authorizeAdminInstructorMiddleware,
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
