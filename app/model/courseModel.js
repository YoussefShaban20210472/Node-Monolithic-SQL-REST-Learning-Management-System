const db = require("../database/db_connection.js");

let client;
// Helper: insert/get tag/category id
async function insertGetId(entity_name, name) {
  const result = await client.query(
    `
        WITH inserted AS (
          INSERT INTO ${entity_name} (name)
          VALUES ($1)
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        )
        SELECT id FROM inserted
        UNION
        SELECT id FROM ${entity_name} WHERE name = $1
        `,
    [name],
  );

  return result.rows[0].id;
}

// Helper: Insert tags/categories relations
async function insertRelations(
  course_id,
  relation_name,
  entity_id_name,
  entity_name,
  names,
) {
  for (const name of names) {
    const id = await insertGetId(entity_name, name);

    await client.query(
      `
        INSERT INTO ${relation_name} (course_id, ${entity_id_name})
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
      [course_id, id],
    );
  }
}

async function createCourse(instructor_id, course) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO courses 
        (title, description, short_description, instructor_id, start_date, end_date)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING id;
      `;

    const values = [
      course.title,
      course.description,
      course.short_description,
      instructor_id,
      course.start_date,
      course.end_date,
    ];

    const course_result = await client.query(query, values);

    const course_id = course_result.rows[0].id;

    // Insert tags relations
    await insertRelations(
      course_id,
      "Course_tags",
      "tag_id",
      "Tags",
      course.tag,
    );

    // Insert categories relations
    await insertRelations(
      course_id,
      "Course_categories",
      "category_id",
      "Categories",
      course.category,
    );

    // 6. Commit transaction
    await client.query("COMMIT");
    return course_result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createCourse,
};
