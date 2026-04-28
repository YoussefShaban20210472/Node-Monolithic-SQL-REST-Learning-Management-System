// userRoutes.js
const express = require("express");
const assignmentController = require("../controller/assignmentController");
const authorizeAdminStudentMiddleware = require("../middleware/authorizeAdminStudentMiddleware");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureJsonBodyRequestMiddleware = require("../middleware/ensureJsonBodyRequestMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/assignment",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.createAssignment,
);

router.put(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.updateAssignmentById,
);

router.get(
  "/course/:course_id/assignment/all",
  idFormatMiddleware,
  ensureUserInCourseMiddleware,
  assignmentController.getAllAssignments,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.deleteAssignment,
);

router.get(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  ensureUserInCourseMiddleware,
  assignmentController.getAssignment,
);

module.exports = router;
