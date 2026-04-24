const db = require("../database/db_connection.js");

async function enroll(course_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Course_Enrollments (course_id, student_id)
      VALUES ($1,$2)
      RETURNING *;
    `;

    const values = [course_id, student_id];

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

async function getEnrollment(course_id, student_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Course_Enrollments WHERE course_id = $1 AND student_id = $2;
    `;

    const values = [course_id, student_id];

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
async function getAllEnrollments(course_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
     select * FROM Course_Enrollments WHERE course_id = $1;
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
  enroll,
  getEnrollment,
  getAllEnrollments,
  unEnroll,
  updateEnrollment,
};
