const submissionMediaFileService = require("../service/submissionMediaFileService");

async function authorizeStudentSubmissionOwnershipMiddleware(req, res, next) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const submission_id = req.params.submission_id;
  if (req.user.role == "student") {
    const submission = await submissionMediaFileService.getSubmission(
      course_id,
      assignment_id,
      submission_id,
    );
    if (`${submission.student_id}` != `${req.user.id}`)
      throw { status: 401, message: "Access denied" };
  }
  next();
}

module.exports = authorizeStudentSubmissionOwnershipMiddleware;
