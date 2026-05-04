const db = require("../database/db_connection.js");

let client;
// Helper: insert/get choice id
async function insertChoiceAndGetId(choice) {
  const result = await client.query(
    `
        WITH inserted AS (
          INSERT INTO  Choices (choice)
          VALUES ($1)
          ON CONFLICT (choice) DO NOTHING
          RETURNING id
        )
        SELECT id FROM inserted
        UNION
        SELECT id FROM Choices WHERE choice = $1
        `,
    [choice],
  );
  return result.rows[0].id;
}

// Helper: Insert choices relations
async function insertRelations(question_id, choices) {
  for (const choice of choices) {
    const id = await insertChoiceAndGetId(choice);

    await client.query(
      `
        INSERT INTO Question_choices (question_id, choice_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
      [question_id, id],
    );
  }
}

async function createQuestionBank(course_id, question) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `
      INSERT INTO Questions 
        (question, answer, score, type)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id;
      `;

    let values = [
      question.question,
      question.answer,
      question.score,
      question.type,
    ];

    const question_result = await client.query(query, values);

    const question_id = question_result.rows[0].id;

    await insertRelations(question_id, question.choice);

    query = `
      INSERT INTO Course_questions 
        (course_id, question_id)
      VALUES
        ($1, $2)
      RETURNING *;
      `;

    values = [course_id, question_id];
    const course_result = await client.query(query, values);

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
async function deleteQuestionBankById(course_id, question_id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      DELETE FROM Course_questions WHERE course_id = $1 AND question_id = $2 RETURNING *;
    `;

    const values = [course_id, question_id];

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
async function getQuestionBankById(course_id, question_id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    let query = `
      SELECT * FROM Course_questions WHERE course_id = $1 AND question_id = $2 ;
    `;

    let values = [course_id, question_id];

    let result = await client.query(query, values);
    if (result.rows.length == 0) {
      await client.query("COMMIT");
      return null;
    }

    query = `
      SELECT * FROM Questions WHERE id = $1 ;
    `;
    result = await client.query(query, [question_id]);

    let question = result.rows[0];

    query = `
      SELECT choice FROM Choices JOIN Question_choices 
      ON 
      Choices.id = Question_choices.choice_id 
      WHERE 
      Question_choices.question_id = $1
    `;
    result = await client.query(query, [question_id]);

    question.choice = [];
    const choices = result.rows;
    for (let choice of choices) {
      question.choice.push(choice.choice);
    }

    await client.query("COMMIT");
    return question;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function getAllQuestionsBank(course_id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    let query = `
      SELECT * FROM Course_questions WHERE course_id = $1 ;
    `;

    let values = [course_id];

    let result = await client.query(query, values);
    let questions_bank = result.rows;
    let questions = [];
    for (let question_bank of questions_bank) {
      let question_id = question_bank.question_id;
      query = `
      SELECT * FROM Questions WHERE id = $1 ;
    `;
      result = await client.query(query, [question_id]);

      let question = result.rows[0];

      query = `
      SELECT choice FROM Choices JOIN Question_choices 
      ON 
      Choices.id = Question_choices.choice_id 
      WHERE 
      Question_choices.question_id = $1
    `;
      result = await client.query(query, [question_id]);

      question.choice = [];
      const choices = result.rows;
      for (let choice of choices) {
        question.choice.push(choice.choice);
      }
      questions.push(question);
    }
    await client.query("COMMIT");
    return questions;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateQuestionBankById(
  course_id,
  question_id,
  question,
  choice,
) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `
      SELECT * FROM Course_questions WHERE course_id = $1 AND question_id = $2 ;
    `;

    let values = [course_id, question_id];

    let result = await client.query(query, values);
    if (result.rows.length == 0) {
      await client.query("COMMIT");
      return null;
    }

    // 1. Build dynamic update query
    const fields = [];
    let index = 1;
    values = [];

    for (const key in question) {
      fields.push(`${key} = $${index}`);
      values.push(question[key]);
      index++;
    }

    // 2. Update only if there are fields
    if (fields.length > 0) {
      const updateQuery = `
        UPDATE Questions
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING id;
      `;

      values.push(question_id);

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        return null;
      }
    }
    // 3. Update tags ONLY if provided
    if (choice != null) {
      await client.query(
        `DELETE FROM Question_choices WHERE question_id = $1`,
        [question_id],
      );
      // Insert tags relations
      await insertRelations(question_id, choice);
    }

    await client.query("COMMIT");

    return { course_id, question_id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
module.exports = {
  createQuestionBank,
  deleteQuestionBankById,
  getQuestionBankById,
  getAllQuestionsBank,
  updateQuestionBankById,
};
