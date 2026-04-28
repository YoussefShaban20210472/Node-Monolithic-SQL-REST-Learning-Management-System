const submissionMediaFileModel = require("../model/submissionMediaFileModel");
const { createEnrollmentSchema } = require("../validator/enrollmentValidator");
const userService = require("./userService");
const fs = require("fs/promises");
const path = require("path");
const { createMediaFileSchema } = require("../validator/mediaFileValidator");
const {
  createSubmissionScoreSchema,
} = require("../validator/submissionValidator");
const assignmentService = require("./assignmentService");
const enrollmentService = require("./enrollmentService");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
async function createSubmissionMediaFiles(
  course_id,
  assignment_id,
  body,
  files,
) {
  let filenames = [];
  if (!files || files.length === 0) {
    throw { status: 400, message: "No files uploaded" };
  }
  for (let file of files) {
    filenames.push(file.originalname);
  }
  console.log(body, filenames);
  try {
    const validatedEnrollment = await createEnrollmentSchema.parse(body);
    const student_id = validatedEnrollment.student_id;
    await userService.assertValidUserId("student", student_id);

    let enrollment = await enrollmentService.getEnrollment(
      { student_id },
      course_id,
    );
    if (enrollment.status != "accepted") {
      throw { status: 401, message: "Student is not enrolled to the course" };
    }

    const _ = await assignmentService.getAssignment(course_id, assignment_id);

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
  const _ = await assignmentService.getAssignment(course_id, assignment_id);
  const submission = await submissionMediaFileModel.getSubmission(
    assignment_id,
    submission_id,
  );
  if (submission == null) {
    throw { status: 404, message: "Submission not found" };
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
  const validateSubmissionMediaFile = createMediaFileSchema.parse({ filename });
  const media_file = await submissionMediaFileModel.getSubmissionMediaFile(
    submission_id,
    filename,
  );
  if (media_file == null) {
    throw { status: 404, message: "Media File not found" };
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
    throw { status: 404, message: "Media File not found" };
  }
  return filePath;
}

async function updateSubmissionScore(
  course_id,
  assignment_id,
  submission_id,
  body,
) {
  const validatedBody = createSubmissionScoreSchema.parse(body);
  const score = validatedBody.score;
  const _ = await assignmentService.getAssignment(course_id, assignment_id);
  const submission = await submissionMediaFileModel.updateSubmissionScore(
    assignment_id,
    submission_id,
    score,
  );
  if (submission == null) {
    throw { status: 404, message: "Submission not found" };
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
