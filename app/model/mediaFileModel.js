const db = require("../database/db_connection.js");

async function createMediaFiles(course_id, filenames) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    let index = 1;
    let rows = [];
    const values = [];
    for (let filename of filenames) {
      rows.push(`($${index},$${index + 1})`);
      values.push(course_id);
      values.push(filename);
      index += 2;
    }
    const query = `
      INSERT INTO Course_media_files (course_id,name)
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

async function deleteMediaFile(course_id, filename) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      DELETE FROM Course_media_files WHERE course_id = $1 AND name = $2
      RETURNING *;
    `;

    const values = [course_id, filename];

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

async function getMediaFile(course_id, filename) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      SELECT * FROM Course_media_files WHERE course_id = $1 AND name = $2
    `;

    const values = [course_id, filename];

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
  createMediaFiles,
  deleteMediaFile,
  getMediaFile,
};
