const assignMentmediaFileService = require("../service/assignMentmediaFileService");
async function createAssignmentMediaFiles(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const files = req.files;
  const _ = await assignMentmediaFileService.createAssignmentMediaFiles(
    course_id,
    assignment_id,
    files,
  );
  res.status(201).json({ message: "Files uploaded successfully" });
}
async function deleteAssignmentMediaFile(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const filename = req.params.filename;
  const _ = await assignMentmediaFileService.deleteAssignmentMediaFile(
    course_id,
    assignment_id,
    filename,
  );
  res.status(200).json({ message: "File deleted successfully" });
}
async function getAssignmentMediaFile(req, res) {
  const course_id = req.params.course_id;
  const assignment_id = req.params.assignment_id;
  const filename = req.params.filename;
  const media_file = await assignMentmediaFileService.getAssignmentMediaFile(
    course_id,
    assignment_id,
    filename,
  );
  res.sendFile(media_file);
}

module.exports = {
  createAssignmentMediaFiles,
  deleteAssignmentMediaFile,
  getAssignmentMediaFile,
};
