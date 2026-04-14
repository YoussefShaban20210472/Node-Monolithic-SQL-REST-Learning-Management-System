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

module.exports = {
  createCourse,
};
