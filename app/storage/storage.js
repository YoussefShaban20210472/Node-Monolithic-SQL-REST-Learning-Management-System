const multer = require("multer");
const path = require("path");
const fs = require("fs");
const DIR = path.join(__dirname, "..", "..", "storage", "uploads", "courses");
const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let course_id = req.params.course_id;
    const dir = path.join(DIR, `${course_id}`, "media_files");
    console.log(dir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let course_id = req.params.course_id;
    let assignment_id = req.params.assignment_id;
    const dir = path.join(
      DIR,
      `${course_id}`,
      "assignments",
      `${assignment_id}`,
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let course_id = req.params.course_id;
    let assignment_id = req.params.assignment_id;
    let student_id;
    if (req.user.role == "student") {
      student_id = req.user.id;
    } else {
      student_id = req.body.student_id;
    }
    const dir = path.join(
      DIR,
      `${course_id}`,
      "submissions",
      `${assignment_id}`,
      `${student_id}`,
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // allow only specific file types
  const allowedTypes = ["application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb({ status: 400, message: "Invalid file type" }, false);
  }
};

const courseUpload = multer({
  storage: courseStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
const assignmentUpload = multer({
  storage: assignmentStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
const submissionUpload = multer({
  storage: submissionStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

module.exports = { courseUpload, assignmentUpload, submissionUpload };
