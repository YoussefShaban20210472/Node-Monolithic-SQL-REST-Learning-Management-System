const attendanceService = require("../service/attendanceService");
const userService = require("../service/userService");
async function attend(req, res) {
  const { course_id, lesson_id, body } = extract(req);
  const _ = await attendanceService.attend(course_id, lesson_id, body);
  res.status(201).json({ message: "Attendance committed successfully" });
}

async function getAttendance(req, res) {
  const { course_id, lesson_id, body } = extract(req, true);
  const attendance = await attendanceService.getAttendance(
    course_id,
    lesson_id,
    body,
  );
  res.status(200).json({ attendance });
}
async function getAllAttendances(req, res) {
  let course_id = req.params.course_id;
  let lesson_id = req.params.lesson_id;

  const attendances = await attendanceService.getAllAttendances(
    course_id,
    lesson_id,
  );
  res.status(200).json({ attendances });
}

function extract(req, addEmptyBody = false) {
  let course_id = req.params.course_id;
  let lesson_id = req.params.lesson_id;
  let body = req.body;
  try {
    if (req.user.role == "student") {
      if (addEmptyBody) body = {};
      body["student_id"] = req.user.id;
    }
  } catch {}
  return { course_id, lesson_id, body };
}
module.exports = {
  attend,
  getAttendance,
  getAllAttendances,
};
