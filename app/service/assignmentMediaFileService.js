const assignmentMediaFileModel = require("../model/assignmentMediaFileModel");
const fs = require("fs/promises");
const path = require("path");
const { mediaFileSchema } = require("../validator/mediaFileValidator");
const { BadRequest, ObjectNotFound } = require("../error/businessError");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
async function createAssignmentMediaFiles(course_id, assignment_id, files) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw new BadRequest("No files uploaded");
  }
  for (let file of files) {
    filenames.push(file.originalname);
  }

  try {
    await assignmentMediaFileModel.createAssignmentMediaFiles(
      assignment_id,
      filenames,
    );
  } catch (error) {
    if (files.length > 0)
      await Promise.all(
        files.map(
          (file) => fs.unlink(file.path).catch(() => {}), // ignore delete errors
        ),
      );
    throw error;
  }
}
async function deleteAssignmentMediaFile(course_id, assignment_id, filename) {
  const validateAssignmentMediaFile = mediaFileSchema.parse({ filename });
  const media_file = await assignmentMediaFileModel.deleteAssignmentMediaFile(
    assignment_id,
    filename,
  );
  if (media_file == null) {
    throw new ObjectNotFound("Media File");
  }
  const dir = path.join(DIR, `${course_id}`, "assignments", `${assignment_id}`);
  const filePath = path.join(dir, filename);
  try {
    await fs.unlink(filePath);
  } catch {}
  return media_file;
}
async function getAssignmentMediaFile(course_id, assignment_id, filename) {
  const validateAssignmentMediaFile = mediaFileSchema.parse({ filename });
  const media_file = await assignmentMediaFileModel.getAssignmentMediaFile(
    assignment_id,
    filename,
  );
  if (media_file == null) {
    throw new ObjectNotFound("Media File");
  }
  const dir = path.join(DIR, `${course_id}`, "assignments", `${assignment_id}`);
  const filePath = path.join(dir, filename);
  try {
    await fs.access(filePath);
  } catch {
    throw new ObjectNotFound("Media File");
  }
  return filePath;
}

module.exports = {
  createAssignmentMediaFiles,
  deleteAssignmentMediaFile,
  getAssignmentMediaFile,
};
