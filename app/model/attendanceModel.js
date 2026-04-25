const db = require("../database/db_connection.js");

async function attend(lesson_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Course_attendances (lesson_id, student_id)
      VALUES ($1,$2)
      RETURNING *;
    `;

    const values = [lesson_id, student_id];

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

async function getAttendance(lesson_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Course_attendances WHERE lesson_id = $1 AND student_id = $2;
    `;

    const values = [lesson_id, student_id];

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
async function getAllAttendances(lesson_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Course_attendances WHERE lesson_id = $1;
    `;

    const values = [lesson_id];

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

module.exports = {
  attend,
  getAttendance,
  getAllAttendances,
};
