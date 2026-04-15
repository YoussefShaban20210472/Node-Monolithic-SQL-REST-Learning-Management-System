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

async function getCourseById(id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      select * from courses where id = $1 ;
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
async function getFullCourseById(id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
    SELECT 
      c.id,
      c.title,
      c.description,
      c.short_description,
      c.instructor_id,
      c.start_date,
      c.end_date,
      c.created_at,
      c.updated_at,

      -- 🏷️ tags
      COALESCE(
        ARRAY_AGG(DISTINCT t.name) 
        FILTER (WHERE t.name IS NOT NULL), 
        '{}'
      ) AS tags,

      -- 🗂️ categories
      COALESCE(
        ARRAY_AGG(DISTINCT cat.name) 
        FILTER (WHERE cat.name IS NOT NULL), 
        '{}'
      ) AS categories

    FROM courses c

    LEFT JOIN course_tags ct 
      ON c.id = ct.course_id
    LEFT JOIN tags t 
      ON ct.tag_id = t.id

    LEFT JOIN course_categories cc 
      ON c.id = cc.course_id
    LEFT JOIN categories cat 
      ON cc.category_id = cat.id

    WHERE c.id = $1
    GROUP BY c.id;
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

async function getAllFullCourses() {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
    SELECT 
      c.id,
      c.title,
      c.description,
      c.short_description,
      c.instructor_id,
      c.start_date,
      c.end_date,
      c.created_at,
      c.updated_at,

      -- 🏷️ tags
      COALESCE(
        ARRAY_AGG(DISTINCT t.name) 
        FILTER (WHERE t.name IS NOT NULL), 
        '{}'
      ) AS tags,

      -- 🗂️ categories
      COALESCE(
        ARRAY_AGG(DISTINCT cat.name) 
        FILTER (WHERE cat.name IS NOT NULL), 
        '{}'
      ) AS categories

    FROM courses c

    LEFT JOIN course_tags ct 
      ON c.id = ct.course_id
    LEFT JOIN tags t 
      ON ct.tag_id = t.id

    LEFT JOIN course_categories cc 
      ON c.id = cc.course_id
    LEFT JOIN categories cat 
      ON cc.category_id = cat.id

    GROUP BY c.id;

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
async function getAllInstructorFullCourses(instructor_id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
    SELECT 
      c.id,
      c.title,
      c.description,
      c.short_description,
      c.instructor_id,
      c.start_date,
      c.end_date,
      c.created_at,
      c.updated_at,

      -- 🏷️ tags
      COALESCE(
        ARRAY_AGG(DISTINCT t.name) 
        FILTER (WHERE t.name IS NOT NULL), 
        '{}'
      ) AS tags,

      -- 🗂️ categories
      COALESCE(
        ARRAY_AGG(DISTINCT cat.name) 
        FILTER (WHERE cat.name IS NOT NULL), 
        '{}'
      ) AS categories

    FROM courses c

    LEFT JOIN course_tags ct 
      ON c.id = ct.course_id
    LEFT JOIN tags t 
      ON ct.tag_id = t.id

    LEFT JOIN course_categories cc 
      ON c.id = cc.course_id
    LEFT JOIN categories cat 
      ON cc.category_id = cat.id

    WHERE c.instructor_id = $1
    GROUP BY c.id;

  `;
    const values = [instructor_id];
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
async function deleteCourseById(id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      delete from courses where id = $1 RETURNING *;
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

async function updateCourseById(id, course, tag, category) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Build dynamic update query
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in course) {
      fields.push(`${key} = $${index}`);
      values.push(course[key]);
      index++;
    }

    let courseId = id;

    // 2. Update only if there are fields
    if (fields.length > 0) {
      const updateQuery = `
        UPDATE courses
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING id;
      `;

      values.push(id);

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        return null;
      }
    }
    // 3. Update tags ONLY if provided
    if (tag != null) {
      await client.query(`DELETE FROM Course_tags WHERE course_id = $1`, [id]);
      // Insert tags relations
      await insertRelations(id, "Course_tags", "tag_id", "Tags", tag);
    }

    // 4. Update categories ONLY if provided
    if (category != null) {
      await client.query(`DELETE FROM Course_categories WHERE course_id = $1`, [
        courseId,
      ]);
      // Insert categories relations
      await insertRelations(
        id,
        "Course_categories",
        "category_id",
        "Categories",
        category,
      );
    }

    await client.query("COMMIT");

    return { id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
module.exports = {
  createCourse,
  getCourseById,
  getFullCourseById,
  getAllFullCourses,
  getAllInstructorFullCourses,
  updateCourseById,
  deleteCourseById,
};
