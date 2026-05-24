const {
  assignmentSchema,
  updateAssignmentSchema,
} = require("../validator/assignmentValidator");
const { assertValidTimeAndDuration } = require("../validator/validator");
const assignmentModel = require("../model/assignmentModel");
const courseService = require("./courseService");
const { ObjectNotFound, BadRequest } = require("../error/businessError");

async function createAssignment(course_id, body) {
  const validatedAssignment = await assignmentSchema.parse(body);
  const course = await courseService.getCourseById(course_id);
  await assertValidTimeAndDuration(course, validatedAssignment, "Assignment");
  const assignment = await assignmentModel.createAssignment(
    course_id,
    validatedAssignment,
  );
  return assignment;
}

async function deleteAssignment(course_id, assignment_id) {
  const assignment = await assignmentModel.deleteAssignment(
    course_id,
    assignment_id,
  );
  if (assignment == null) {
    throw new ObjectNotFound("Assignment");
  }
  return assignment;
}
async function getAssignment(course_id, assignment_id) {
  const assignment = await assignmentModel.getAssignment(
    course_id,
    assignment_id,
  );
  if (assignment == null) {
    throw new ObjectNotFound("Assignment");
  }
  return assignment;
}

async function getAllAssignments(course_id) {
  const assignments = await assignmentModel.getAllAssignments(course_id);
  return assignments;
}

async function updateAssignmentById(course_id, assignment_id, assignment) {
  // Validate assignment
  // Schema Validation
  const validatedAssignment = updateAssignmentSchema.parse(assignment);

  let safeAssignment = {};
  const safeFields = [
    "title",
    "description",
    "start_date",
    "end_date",
    "score",
  ];
  safeFields.forEach((safeField) => {
    if (validatedAssignment[safeField] != null) {
      safeAssignment[safeField] = validatedAssignment[safeField];
    }
  });
  if (Object.keys(safeAssignment).length === 0) {
    throw new BadRequest(
      "You have to provide at least one allowed field to update the assignment",
    );
  }

  const course = await courseService.getCourseById(course_id);
  const oldAssignment = await assignmentModel.getAssignment(
    course_id,
    assignment_id,
  );

  if (validatedAssignment.start_date == null) {
    validatedAssignment.start_date = oldAssignment.start_date;
  }
  if (validatedAssignment.end_date == null) {
    validatedAssignment.end_date = oldAssignment.end_date;
  }

  assertValidTimeAndDuration(course, validatedAssignment, "Assignment");

  const updatedAssignment = await assignmentModel.updateAssignmentById(
    course_id,
    assignment_id,
    safeAssignment,
  );
  if (updatedAssignment == null) {
    throw new ObjectNotFound("Assignment");
  }

  return updatedAssignment;
}

module.exports = {
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAllAssignments,
  updateAssignmentById,
};
