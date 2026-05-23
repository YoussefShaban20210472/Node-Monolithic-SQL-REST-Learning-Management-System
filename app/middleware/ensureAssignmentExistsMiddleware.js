const assignmentService = require("../service/assignmentService");

async function ensureAssignmentExistsMiddleware(req, res, next) {
  let course_id = req.params.course_id;
  let assignment_id = req.params.assignment_id;
  await assignmentService.getAssignment(course_id, assignment_id);
  next();
}

module.exports = ensureAssignmentExistsMiddleware;
