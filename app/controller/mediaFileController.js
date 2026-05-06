const mediaFileService = require("../service/mediaFileService");
const notificationService = require("../service/notificationService");
async function createMediaFiles(req, res) {
  const course_id = req.params.course_id;
  const files = req.files;
  const _ = await mediaFileService.createMediaFiles(course_id, files);

  await notificationService.notifyAllEnrolledStudents(
    course_id,
    "New course media files have been released",
  );

  res.status(201).json({ message: "Files uploaded successfully" });
}
async function deleteMediaFile(req, res) {
  const course_id = req.params.course_id;
  const filename = req.params.filename;
  const _ = await mediaFileService.deleteMediaFile(course_id, filename);

  await notificationService.notifyAllEnrolledStudents(
    course_id,
    "The course media file has been deleted",
  );

  res.status(200).json({ message: "File deleted successfully" });
}
async function getMediaFile(req, res) {
  const course_id = req.params.course_id;
  const filename = req.params.filename;
  const media_file = await mediaFileService.getMediaFile(course_id, filename);
  res.sendFile(media_file);
}

module.exports = {
  createMediaFiles,
  deleteMediaFile,
  getMediaFile,
};
