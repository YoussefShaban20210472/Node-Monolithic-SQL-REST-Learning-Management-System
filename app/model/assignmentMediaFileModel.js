const db = require("../database/db_connection.js");

async function createAssignmentMediaFiles(assignment_id, filenames) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    let index = 1;
    let rows = [];
    const values = [];
    for (let filename of filenames) {
      rows.push(`($${index},$${index + 1})`);
      values.push(assignment_id);
      values.push(filename);
      index += 2;
    }
    const query = `
      INSERT INTO Assignment_media_files (assignment_id,name)
      VALUES ${rows.join(",")}
    `;

    const result = await client.query(query, values);

    await client.query("COMMIT");
    // return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function deleteAssignmentMediaFile(assignment_id, filename) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      DELETE FROM Assignment_media_files WHERE assignment_id = $1 AND name = $2
      RETURNING *;
    `;

    const values = [assignment_id, filename];

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

async function getAssignmentMediaFile(assignment_id, filename) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Assignment_media_files WHERE assignment_id = $1 AND name = $2
    `;

    const values = [assignment_id, filename];

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
  createAssignmentMediaFiles,
  deleteAssignmentMediaFile,
  getAssignmentMediaFile,
};
