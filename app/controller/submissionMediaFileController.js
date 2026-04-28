const submissionMediaFileService = require("../service/submissionMediaFileService");
async function createSubmissionMediaFiles(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const files = req.files;
  let body = req.body;
  try {
    if (req.user.role == "student") {
      body = {};
      body["student_id"] = req.user.id;
    }
  } catch {}

  const submission =
    await submissionMediaFileService.createSubmissionMediaFiles(
      course_id,
      assignment_id,
      body,
      files,
    );
  res.status(201).json({ submission });
}
async function deleteSubmissionMediaFile(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const submission_id = req.params.submission_id;
  const _ = await submissionMediaFileService.deleteSubmissionMediaFile(
    course_id,
    assignment_id,
    submission_id,
  );
  res.status(200).json({ message: "File deleted successfully" });
}
async function getSubmission(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const submission_id = req.params.submission_id;
  const _ = await submissionMediaFileService.getSubmission(
    course_id,
    assignment_id,
    submission_id,
  );
  res.status(200).json({ message: "File deleted successfully" });
}
async function updateSubmissionScore(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const submission_id = req.params.submission_id;
  const body = req.body;
  const submission = await submissionMediaFileService.updateSubmissionScore(
    course_id,
    assignment_id,
    submission_id,
    body,
  );
  res.status(200).json({ submission });
}
async function getSubmissionMediaFile(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const submission_id = req.params.submission_id;
  const filename = req.params.filename;
  const media_file = await submissionMediaFileService.getSubmissionMediaFile(
    course_id,
    assignment_id,
    submission_id,
    filename,
  );
  res.sendFile(media_file);
}

module.exports = {
  createSubmissionMediaFiles,
  deleteSubmissionMediaFile,
  getSubmissionMediaFile,
  getSubmission,
  updateSubmissionScore,
};
