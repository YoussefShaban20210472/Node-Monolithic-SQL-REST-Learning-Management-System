const enrollmentService = require("../service/enrollmentService");
const userService = require("../service/userService");
async function enroll(req, res) {
  const { course_id, body } = extract(req, true);
  const _ = await enrollmentService.enroll(course_id, body);
  res.status(201).json({ message: "Enrollment request created successfully" });
}

async function unEnroll(req, res) {
  const { course_id, body } = extract(req, true);
  const _ = await enrollmentService.unEnroll(course_id, body);
  res.status(200).json({ message: "Enrollment request deleted successfully" });
}

async function updateEnrollment(req, res) {
  const { course_id, body } = extract(req);
  const _ = await enrollmentService.updateEnrollment(body, course_id);
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
};
