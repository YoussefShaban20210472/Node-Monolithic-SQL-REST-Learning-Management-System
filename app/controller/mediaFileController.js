const mediaFileService = require("../service/mediaFileService");
async function createMediaFiles(req, res) {
  const course_id = req.params.course_id;
  const files = req.files;
  const _ = await mediaFileService.createMediaFiles(course_id, files);
  res.status(201).json({ message: "Files uploaded successfully" });
}
async function deleteMediaFile(req, res) {
  const course_id = req.params.course_id;
  const filename = req.params.filename;
  const _ = await mediaFileService.deleteMediaFile(course_id, filename);
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
