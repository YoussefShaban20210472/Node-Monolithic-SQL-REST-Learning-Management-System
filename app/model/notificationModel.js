const db = require("../database/db_connection.js");

async function notify(course_id, user_id, message) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Notifications (course_id, user_id, message)
      VALUES ($1,$2,$3)
      RETURNING *;
    `;

    const values = [course_id, user_id, message];

    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function notifyAllEnrolledStudents(course_id, message) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Notifications (course_id, user_id, message) 
      SELECT course_id, student_id, $2 
      FROM Course_enrollments where course_id = $1 and status = 'accepted'
    `;

    const values = [course_id, message];

    const result = await client.query(query, values);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function notifyCourseInstructor(course_id, message) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Notifications (course_id, user_id, message) 
      SELECT id, instructor_id, $2 
      FROM Courses where id = $1
    `;

    const values = [course_id, message];

    const result = await client.query(query, values);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function notifyStudentBySubmissionId(course_id, submission_id, message) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Notifications (course_id, user_id, message) 
      SELECT $1, student_id, $3 
      FROM Submissions where id = $2
    `;

    const values = [course_id, submission_id, message];

    const result = await client.query(query, values);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function getNotificationsByStatus(user_id, status) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Notifications WHERE user_id = $1 AND status = $2
    `;

    const values = [user_id, status];

    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function getAllNotifications(user_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Notifications WHERE user_id = $1
    `;

    const values = [user_id];

    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function markAllNotificationsAsRead(user_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      UPDATE Notifications SET status = 'read' WHERE user_id = $1
    `;

    const values = [user_id];

    const result = await client.query(query, values);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
module.exports = {
  notify,
  notifyAllEnrolledStudents,
  notifyCourseInstructor,
  notifyStudentBySubmissionId,
  getNotificationsByStatus,
  getAllNotifications,
  markAllNotificationsAsRead,
};
