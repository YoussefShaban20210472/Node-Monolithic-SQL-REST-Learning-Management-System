const db = require("../database/db_connection.js");

async function createLesson(course_id, lesson) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Lessons (title, description, otp, start_date, end_date, course_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;

    const values = [
      lesson.title,
      lesson.description,
      lesson.otp,
      lesson.start_date,
      lesson.end_date,
      course_id,
    ];

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

async function deleteLesson(course_id, lesson_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      DELETE FROM Lessons WHERE course_id = $1 AND id = $2
      RETURNING *;
    `;

    const values = [course_id, lesson_id];

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

async function getLesson(course_id, lesson_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT id,title, description, otp, start_date, end_date FROM Lessons WHERE course_id = $1 AND id = $2
    `;

    const values = [course_id, lesson_id];
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
async function getLessonOTP(course_id, lesson_id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const query = `
      SELECT id,otp FROM Lessons WHERE course_id = $1 AND id = $2
    `;

    const values = [course_id, lesson_id];
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
async function getAllLessons(course_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT id,title, description, otp, start_date, end_date FROM Lessons WHERE course_id = $1
    `;

    const values = [course_id];
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

async function updateLessonById(course_id, lesson_id, lesson) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const fields = [];
    const values = [];
    let index = 1;

    for (let key in lesson) {
      fields.push(`${key} = $${index}`);
      values.push(lesson[key]);
      index++;
    }
    values.push(course_id);
    index++;
    values.push(lesson_id);

    const query = `
    UPDATE Lessons
    SET ${fields.join(", ")}
    WHERE course_id = $${index - 1} AND id = $${index}
    RETURNING *
  `;
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

module.exports = {
  createLesson,
  deleteLesson,
  getLesson,
  getLessonOTP,
  getAllLessons,
  updateLessonById,
};
