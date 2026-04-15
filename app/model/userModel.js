const db = require("../database/db_connection.js");

async function createUser(user) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO Users (first_name, last_name, email, password, phone_number, address, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
    `;

    const values = [
      user.first_name,
      user.last_name,
      user.email,
      user.password,
      user.phone_number,
      user.address,
      user.role,
    ];

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

async function findUserByEmail(email) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      SELECT * FROM Users WHERE email = $1 LIMIT 1;
    `;

    const values = [email];

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

async function getAllUsers() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      SELECT id,first_name,last_name,email,phone_number,role,address,created_at,updated_at FROM Users;
    `;

    const result = await client.query(query);
    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function findUserById(id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      SELECT id,first_name,last_name,email,phone_number,role,address,created_at,updated_at FROM Users WHERE id = $1 LIMIT 1;
    `;

    const values = [id];

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
async function deleteUserById(id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      delete from users where id = $1 RETURNING *;
    `;

    const values = [id];

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
async function updateUserById(id, user) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const fields = [];
    const values = [];
    let index = 1;

    for (let key in user) {
      fields.push(`${key} = $${index}`);
      values.push(user[key]);
      index++;
    }
    values.push(id);

    const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${index}
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
  createUser,
  findUserByEmail,
  getAllUsers,
  findUserById,
  deleteUserById,
  updateUserById,
};
