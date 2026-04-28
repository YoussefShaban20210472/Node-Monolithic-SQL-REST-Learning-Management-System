const assignmentService = require("../service/assignmentService");
const userService = require("../service/userService");
async function createAssignment(req, res) {
  const course_id = req.params.course_id;
  const body = req.body;
  const assignment = await assignmentService.createAssignment(course_id, body);
  res.status(201).json({ assignment });
}
async function deleteAssignment(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const _ = await assignmentService.deleteAssignment(course_id, assignment_id);
  res.status(200).json({ message: "assignment deleted successfully" });
}
async function getAssignment(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const assignment = await assignmentService.getAssignment(
    course_id,
    assignment_id,
  );
  res.status(200).json({ assignment });
}

async function getAllAssignments(req, res) {
  const course_id = req.params.course_id;
  const assignments = await assignmentService.getAllAssignments(course_id);
  res.status(200).json({ assignments });
}

async function updateAssignmentById(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const body = req.body;

  const _ = await assignmentService.updateAssignmentById(
    course_id,
    assignment_id,
    body,
  );
  res.status(200).json({ message: "assignment updated successfully" });
}
module.exports = {
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAllAssignments,
  updateAssignmentById,
};
