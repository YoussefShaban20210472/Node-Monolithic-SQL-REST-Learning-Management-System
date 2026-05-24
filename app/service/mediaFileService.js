const mediaFileModel = require("../model/mediaFileModel");
const fs = require("fs/promises");
const path = require("path");
const { mediaFileSchema } = require("../validator/mediaFileValidator");
const { ObjectNotFound, BadRequest } = require("../error/businessError");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
async function createMediaFiles(course_id, files) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw new BadRequest("No files uploaded");
  }
  for (let file of files) {
    filenames.push(file.originalname);
  }
  try {
    await mediaFileModel.createMediaFiles(course_id, filenames);
  } catch (error) {
    await Promise.all(
      files.map(
        (file) => fs.unlink(file.path).catch(() => {}), // ignore delete errors
      ),
    );
    throw error;
  }
}
async function deleteMediaFile(course_id, filename) {
  const validateMediaFile = mediaFileSchema.parse({ filename });
  const media_file = await mediaFileModel.deleteMediaFile(course_id, filename);
  if (media_file == null) {
    throw new ObjectNotFound("Media File");
  }
  const dir = path.join(DIR, `${course_id}`, "media_files");
  const filePath = path.join(dir, filename);
  try {
    await fs.unlink(filePath);
  } catch {}
  return media_file;
}
async function getMediaFile(course_id, filename) {
  const validateMediaFile = mediaFileSchema.parse({ filename });
  const media_file = await mediaFileModel.getMediaFile(course_id, filename);
  if (media_file == null) {
    throw new ObjectNotFound("Media File");
  }
  const dir = path.join(DIR, `${course_id}`, "media_files");
  const filePath = path.join(dir, filename);
  try {
    await fs.access(filePath);
  } catch {
    throw new ObjectNotFound("Media File");
  }
  return filePath;
}

module.exports = {
  createMediaFiles,
  deleteMediaFile,
  getMediaFile,
};
