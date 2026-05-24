const { BadRequest, ObjectNotFound } = require("../error/businessError");
const submissionMediaFileModel = require("../model/submissionMediaFileModel");
const { mediaFileSchema } = require("../validator/mediaFileValidator");
const { submissionScoreSchema } = require("../validator/submissionValidator");
const enrollmentService = require("./enrollmentService");
const fs = require("fs/promises");
const path = require("path");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
async function createSubmissionMediaFiles(
  course_id,
  assignment_id,
  body,
  files,
) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw new BadRequest("No files uploaded");
  }
  for (let file of files) {
    filenames.push(file.originalname);
  }
  try {
    const student_id = body.student_id;

    return await submissionMediaFileModel.createSubmissionMediaFiles(
      student_id,
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

async function getSubmission(course_id, assignment_id, submission_id) {
  const submission = await submissionMediaFileModel.getSubmission(
    assignment_id,
    submission_id,
  );
  if (submission == null) {
    throw new ObjectNotFound("Submission");
  }
  return submission;
}

async function deleteSubmissionMediaFile(
  course_id,
  assignment_id,
  submission_id,
) {
  const submission = await getSubmission(
    course_id,
    assignment_id,
    submission_id,
  );

  await submissionMediaFileModel.deleteSubmissionMediaFile(submission_id);

  const dir = path.join(
    DIR,
    `${course_id}`,
    "submissions",
    `${assignment_id}`,
    `${submission.student_id}`,
  );
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {}
}
async function getSubmissionMediaFile(
  course_id,
  assignment_id,
  submission_id,
  filename,
) {
  const submission = await getSubmission(
    course_id,
    assignment_id,
    submission_id,
  );
  const validateSubmissionMediaFile = mediaFileSchema.parse({ filename });
  const media_file = await submissionMediaFileModel.getSubmissionMediaFile(
    submission_id,
    filename,
  );
  if (media_file == null) {
    throw new ObjectNotFound("Media File");
  }
  const dir = path.join(
    DIR,
    `${course_id}`,
    "submissions",
    `${assignment_id}`,
    `${submission.student_id}`,
  );
  const filePath = path.join(dir, filename);
  try {
    await fs.access(filePath);
  } catch {
    throw new ObjectNotFound("Submission");
  }
  return filePath;
}

async function updateSubmissionScore(
  course_id,
  assignment_id,
  submission_id,
  body,
) {
  const validatedBody = submissionScoreSchema.parse(body);
  const score = validatedBody.score;
  const submission = await submissionMediaFileModel.updateSubmissionScore(
    assignment_id,
    submission_id,
    score,
  );
  if (submission == null) {
    throw new ObjectNotFound("Submission");
  }
  return submission;
}

module.exports = {
  createSubmissionMediaFiles,
  deleteSubmissionMediaFile,
  getSubmissionMediaFile,
  getSubmission,
  updateSubmissionScore,
};
