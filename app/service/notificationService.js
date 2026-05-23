const { notificationSchema } = require("../validator/notificationValidator");
const notificationModel = require("../model/notificationModel");

async function notify(course_id, user_id, message) {
  return await notificationModel.notify(course_id, user_id, message);
}
async function notifyAllEnrolledStudents(course_id, message) {
  return await notificationModel.notifyAllEnrolledStudents(course_id, message);
}
async function notifyCourseInstructor(course_id, message) {
  return await notificationModel.notifyCourseInstructor(course_id, message);
}
async function notifyStudentBySubmissionId(course_id, submission_id, message) {
  return await notificationModel.notifyStudentBySubmissionId(
    course_id,
    submission_id,
    message,
  );
}
async function getNotifications(body) {
  const validatedBody = notificationSchema.parse(body);
  const user_id = validatedBody.user_id;
  const status = validatedBody.status;
  let notifications;
  if (status == null || status === "all") {
    notifications = await notificationModel.getAllNotifications(user_id);
  } else {
    notifications = await notificationModel.getNotificationsByStatus(
      user_id,
      status,
    );
  }

  if (status == null || status !== "read") {
    await notificationModel.markAllNotificationsAsRead(user_id);
  }

  return notifications;
}

module.exports = {
  notify,
  notifyAllEnrolledStudents,
  notifyCourseInstructor,
  notifyStudentBySubmissionId,
  getNotifications,
};
