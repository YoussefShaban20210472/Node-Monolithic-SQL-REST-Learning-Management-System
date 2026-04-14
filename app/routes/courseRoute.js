// userRoutes.js
const express = require("express");
const courseController = require("../controller/courseController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course",
  authorizeAdminInstructorMiddleware,
  courseController.createCourse,
);

module.exports = router;
