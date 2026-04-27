const mediaFileModel = require("../model/mediaFileModel");
const fs = require("fs/promises");
const path = require("path");
const { createMediaFileSchema } = require("../validator/mediaFileValidator");
const DIR = path.join(__dirname, "..", "..", "Storage", "uploads", "courses");
async function createMediaFiles(course_id, files) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw { status: 400, message: "No files uploaded" };
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
  const validateMediaFile = createMediaFileSchema.parse({ filename });
  const media_file = await mediaFileModel.deleteMediaFile(course_id, filename);
  if (media_file == null) {
    throw { status: 404, message: "Media File not found" };
  }
  const dir = path.join(DIR, `${course_id}`, "media_files");
  const filePath = path.join(dir, filename);
  try {
    await fs.unlink(filePath);
  } catch {}
  return media_file;
}
async function getMediaFile(course_id, filename) {
  const validateMediaFile = createMediaFileSchema.parse({ filename });
  const media_file = await mediaFileModel.getMediaFile(course_id, filename);
  if (media_file == null) {
    throw { status: 404, message: "Media File not found" };
  }
  const dir = path.join(DIR, `${course_id}`, "media_files");
  const filePath = path.join(dir, filename);
  try {
    await fs.access(filePath);
  } catch {
    throw { status: 404, message: "Media File not found" };
  }
  return filePath;
}

module.exports = {
  createMediaFiles,
  deleteMediaFile,
  getMediaFile,
};
