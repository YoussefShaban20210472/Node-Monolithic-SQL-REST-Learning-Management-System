const courseService = require("../service/courseService");
const userService = require("../service/userService");
async function createCourse(req, res) {
  let body = req.body;
  try {
    if (req.user.role == "instructor") {
      body["instructor_id"] = req.user.id;
    }
  } catch {}

  // Create course
  const course = await courseService.createCourse(body);
  res.status(201).json({ course });
}

async function GetFullCourseById(req, res) {
  let course_id = req.params.course_id;

  const course = await courseService.getFullCourseById(course_id);
  res.status(200).json({ course });
}

async function getAllFullCourses(req, res) {
  let courses;

  if (req.user.role == "instructor") {
    courses = await courseService.getAllInstructorFullCourses(req.user.id);
  } else {
    courses = await courseService.getAllFullCourses();
  }
  res.status(200).json({ courses });
}

async function updateCourseById(req, res) {
  let course_id = req.params.course_id;
  const _ = await courseService.updateCourseById(course_id, req.body);
  res.status(200).json({ message: "Course updated successfully" });
}

async function deleteCourseById(req, res) {
  let course_id = req.params.course_id;

  const _ = await courseService.deleteCourseById(course_id);
  res.status(200).json({ message: "Course deleted successfully" });
}
module.exports = {
  createCourse,
  GetFullCourseById,
  getAllFullCourses,
  updateCourseById,
  deleteCourseById,
};
