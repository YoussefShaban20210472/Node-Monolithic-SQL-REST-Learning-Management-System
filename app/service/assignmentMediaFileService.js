const assignmentMediaFileModel = require("../model/assignmentMediaFileModel");
const fs = require("fs/promises");
const path = require("path");
const { createMediaFileSchema } = require("../validator/mediaFileValidator");
const assignmentService = require("./assignmentService");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
async function createAssignmentMediaFiles(course_id, assignment_id, files) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw { status: 400, message: "No files uploaded" };
  }
  for (let file of files) {
    filenames.push(file.originalname);
  }

  try {
    const _ = await assignmentService.getAssignment(course_id, assignment_id);

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
  const _ = await assignmentService.getAssignment(course_id, assignment_id);
  const validateAssignmentMediaFile = createMediaFileSchema.parse({ filename });
  const media_file = await assignmentMediaFileModel.deleteAssignmentMediaFile(
    assignment_id,
    filename,
  );
  if (media_file == null) {
    throw { status: 404, message: "Media File not found" };
  }
  const dir = path.join(DIR, `${course_id}`, "assignments", `${assignment_id}`);
  const filePath = path.join(dir, filename);
  try {
    await fs.unlink(filePath);
  } catch {}
  return media_file;
}
async function getAssignmentMediaFile(course_id, assignment_id, filename) {
  const _ = await assignmentService.getAssignment(course_id, assignment_id);
  const validateAssignmentMediaFile = createMediaFileSchema.parse({ filename });
  const media_file = await assignmentMediaFileModel.getAssignmentMediaFile(
    assignment_id,
    filename,
  );
  if (media_file == null) {
    throw { status: 404, message: "Media File not found" };
  }
  const dir = path.join(DIR, `${course_id}`, "assignments", `${assignment_id}`);
  const filePath = path.join(dir, filename);
  try {
    await fs.access(filePath);
  } catch {
    throw { status: 404, message: "Media File not found" };
  }
  return filePath;
}

module.exports = {
  createAssignmentMediaFiles,
  deleteAssignmentMediaFile,
  getAssignmentMediaFile,
};
