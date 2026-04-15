const courseService = require("../service/courseService");
const userService = require("../service/userService");
async function createCourse(req, res) {
  let instructor_id;
  if (req.user.role == "instructor") {
    instructor_id = req.user.id;
  } else {
    instructor_id = req.body.instructor_id;

    await userService.assertValidInstructorId(instructor_id);
  }
  // Create course
  const course = await courseService.createCourse(instructor_id, req.body);
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
