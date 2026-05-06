const enrollmentService = require("../service/enrollmentService");
const userService = require("../service/userService");
const notificationService = require("../service/notificationService");
async function enroll(req, res) {
  const { course_id, body } = extract(req, true);
  const _ = await enrollmentService.enroll(course_id, body);

  await notificationService.notifyCourseInstructor(
    course_id,
    "A new student enrolled to the course",
  );

  res.status(201).json({ message: "Enrollment request created successfully" });
}

async function unEnroll(req, res) {
  const { course_id, body } = extract(req, true);
  const _ = await enrollmentService.unEnroll(course_id, body);

  await notificationService.notifyCourseInstructor(
    course_id,
    "a student unenrolled from the course",
  );

  res.status(200).json({ message: "Enrollment request deleted successfully" });
}

async function getAllEnrollments(req, res) {
  const course_id = req.params.course_id;
  const enrollments = await enrollmentService.getAllEnrollments(course_id);
  res.status(200).json({ enrollments });
}

async function updateEnrollment(req, res) {
  const { course_id, body } = extract(req);
  const _ = await enrollmentService.updateEnrollment(body, course_id);

  await notificationService.notify(
    course_id,
    body.student_id,
    `The enrollment request has been ${body.status}`,
  );

  res.status(200).json({ message: "Enrollment updated successfully" });
}

function extract(req, addEmptyBody = false) {
  let course_id = req.params.course_id;
  let body = req.body;
  try {
    if (req.user.role == "student") {
      if (addEmptyBody) body = {};

      body["student_id"] = req.user.id;
    }
  } catch {}
  return { course_id, body };
}
module.exports = {
  enroll,
  unEnroll,
  updateEnrollment,
  getAllEnrollments,
};
