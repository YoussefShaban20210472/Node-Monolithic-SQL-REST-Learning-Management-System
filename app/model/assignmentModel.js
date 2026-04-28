const db = require("../database/db_connection.js");

async function createAssignment(course_id, assignment) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Assignments (title, description, score, start_date, end_date, course_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;

    const values = [
      assignment.title,
      assignment.description,
      assignment.score,
      assignment.start_date,
      assignment.end_date,
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

async function deleteAssignment(course_id, assignment_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      DELETE FROM Assignments WHERE course_id = $1 AND id = $2
      RETURNING *;
    `;

    const values = [course_id, assignment_id];

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

async function getAssignment(course_id, assignment_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT id,title, description, score, start_date, end_date FROM Assignments WHERE course_id = $1 AND id = $2
    `;

    const values = [course_id, assignment_id];
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

async function getAllAssignments(course_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT id,title, description, score, start_date, end_date FROM Assignments WHERE course_id = $1
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

async function updateAssignmentById(course_id, assignment_id, assignment) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const fields = [];
    const values = [];
    let index = 1;

    for (let key in assignment) {
      fields.push(`${key} = $${index}`);
      values.push(assignment[key]);
      index++;
    }
    values.push(course_id);
    index++;
    values.push(assignment_id);

    const query = `
    UPDATE Assignments
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
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAllAssignments,
  updateAssignmentById,
};
