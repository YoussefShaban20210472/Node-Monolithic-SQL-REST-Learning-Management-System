const { AccessDeny } = require("../error/businessError");
const submissionMediaFileService = require("../service/submissionMediaFileService");

async function authorizeStudentSubmissionOwnershipMiddleware(req, res, next) {
  if (req.user.role == "student") {
    const course_id = req.params.course_id;
    const assignment_id = req.params.assignment_id;
    const submission_id = req.params.submission_id;
    const submission = await submissionMediaFileService.getSubmission(
      course_id,
      assignment_id,
      submission_id,
    );
    if (`${submission.student_id}` != `${req.user.id}`) throw new AccessDeny();
  }
  next();
}

module.exports = authorizeStudentSubmissionOwnershipMiddleware;
