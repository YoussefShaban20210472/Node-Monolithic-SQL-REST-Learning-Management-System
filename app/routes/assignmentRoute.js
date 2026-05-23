// userRoutes.js
const express = require("express");
const assignmentController = require("../controller/assignmentController");
const authorizeAdminInstructorMiddleware = require("../middleware/authorizeAdminInstructorMiddleware");
const authorizeInstructorOwnershipMiddleware = require("../middleware/authorizeInstructorOwnershipMiddleware");
const ensureCourseExistsMiddleware = require("../middleware/ensureCourseExistsMiddleware");
const ensureUserInCourseMiddleware = require("../middleware/ensureUserInCourseMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.post(
  "/course/:course_id/assignment",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.createAssignment,
);

router.put(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.updateAssignmentById,
);

router.get(
  "/course/:course_id/assignment/all",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  assignmentController.getAllAssignments,
);
router.delete(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  authorizeAdminInstructorMiddleware,
  ensureCourseExistsMiddleware,
  authorizeInstructorOwnershipMiddleware,
  assignmentController.deleteAssignment,
);

router.get(
  "/course/:course_id/assignment/:assignment_id",
  idFormatMiddleware,
  ensureCourseExistsMiddleware,
  ensureUserInCourseMiddleware,
  assignmentController.getAssignment,
);

module.exports = router;
