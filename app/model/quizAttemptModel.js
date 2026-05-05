const db = require("../database/db_connection.js");

async function createQuizAttempt(quiz_id, student_id, score) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Quiz_attempts (quiz_id, student_id, score)
      VALUES ($1,$2,$3)
      RETURNING *;
    `;

    const values = [quiz_id, student_id, score];

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

async function getQuizAttempt(quiz_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Quiz_attempts WHERE quiz_id = $1 AND student_id = $2;
    `;

    const values = [quiz_id, student_id];

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
async function getAllQuizAttempts(quiz_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Quiz_attempts WHERE quiz_id = $1;
    `;

    const values = [quiz_id];

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

async function unEnroll(course_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const query = `
    DELETE FROM Course_Enrollments WHERE course_id = $1 AND student_id = $2 AND status = 'pending'
    `;

    const values = [course_id, student_id];
    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function updateEnrollment(status, course_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const query = `
    update Course_Enrollments set status = $1 WHERE course_id = $2 AND student_id = $3
    `;

    const values = [status, course_id, student_id];
    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
module.exports = {
  createQuizAttempt,
  getQuizAttempt,
  getAllQuizAttempts,
  unEnroll,
  updateEnrollment,
};
