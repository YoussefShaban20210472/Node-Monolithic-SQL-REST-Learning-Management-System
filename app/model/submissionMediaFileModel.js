const db = require("../database/db_connection.js");

async function createSubmissionMediaFiles(
  student_id,
  assignment_id,
  filenames,
) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `INSERT INTO Submissions (assignment_id, student_id) VALUES ($1,$2) RETURNING *;`;
    let result = await client.query(query, [assignment_id, student_id]);
    let submission = result.rows[0];
    let index = 1;
    let rows = [];
    const values = [];
    for (let filename of filenames) {
      rows.push(`($${index},$${index + 1})`);
      values.push(submission.id);
      values.push(filename);
      index += 2;
    }
    query = `
      INSERT INTO Submission_media_files (submission_id,name)
      VALUES ${rows.join(",")}
    `;

    result = await client.query(query, values);

    await client.query("COMMIT");
    // return result.rows[0] || null;
    return submission;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function deleteSubmissionMediaFile(submission_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      DELETE FROM Submissions WHERE id = $1 RETURNING *;
    `;

    const values = [submission_id];

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

async function getSubmissionMediaFile(submission_id, filename) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Submission_media_files WHERE submission_id = $1 AND name = $2
    `;

    const values = [submission_id, filename];

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

async function getSubmission(assignment_id, submission_id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Submissions WHERE assignment_id = $1 AND id = $2
    `;

    const values = [assignment_id, submission_id];

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

async function updateSubmissionScore(assignment_id, submission_id, score) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      UPDATE Submissions SET score = $1 WHERE assignment_id = $2 AND id = $3 RETURNING *;
    `;

    const values = [score, assignment_id, submission_id];

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
  createSubmissionMediaFiles,
  deleteSubmissionMediaFile,
  getSubmissionMediaFile,
  getSubmission,
  updateSubmissionScore,
};
