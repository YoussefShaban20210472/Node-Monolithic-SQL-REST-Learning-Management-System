const db = require("../database/db_connection.js");

let client;

// Helper: Insert choices relations
async function insertRelations(quiz_id, questions_ids) {
  for (const question_id of questions_ids) {
    await client.query(
      `
        INSERT INTO Quiz_Questions (quiz_id, question_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
      [quiz_id, question_id],
    );
  }
}
async function createQuiz(course_id, quiz) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `
      INSERT INTO Quizzes 
        (title, description, start_date, end_date, course_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id;
      `;

    let values = [
      quiz.title,
      quiz.description,
      quiz.start_date,
      quiz.end_date,
      course_id,
    ];

    const quiz_result = await client.query(query, values);

    const quiz_id = quiz_result.rows[0].id;

    await insertRelations(quiz_id, quiz.question);

    await client.query("COMMIT");
    return quiz_result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
async function deleteQuizById(course_id, quiz_id) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
      DELETE FROM Quizzes WHERE course_id = $1 AND id = $2 RETURNING course_id,id;
    `;

    const values = [course_id, quiz_id];

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
async function getQuizById(course_id, quiz_id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    let query = `
      SELECT * FROM Quizzes WHERE course_id = $1 AND id = $2 ;
    `;

    let values = [course_id, quiz_id];

    let result = await client.query(query, values);
    if (result.rows.length == 0) {
      await client.query("COMMIT");
      return null;
    }
    const quiz = result.rows[0];
    query = `
      SELECT Questions.* FROM Questions JOIN Quiz_Questions 
      ON 
      Questions.id = Quiz_Questions.question_id 
      WHERE 
      Quiz_Questions.quiz_id = $1
    `;
    result = await client.query(query, [quiz_id]);

    let questions = result.rows;
    for (let i = 0; i < questions.length; i++) {
      query = `
      SELECT choice FROM Choices JOIN Question_choices 
      ON 
      Choices.id = Question_choices.choice_id 
      WHERE 
      Question_choices.question_id = $1
    `;
      result = await client.query(query, [questions[i].id]);

      questions[i].choice = [];
      const choices = result.rows;
      for (let choice of choices) {
        questions[i].choice.push(choice.choice);
      }
    }
    quiz.question = questions;
    await client.query("COMMIT");
    return quiz;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function getAllQuizzes(course_id) {
  client = await db.connect();
  try {
    await client.query("BEGIN");
    let query = `
      SELECT * FROM Quizzes WHERE course_id = $1 ;
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

async function updateQuizById(course_id, quiz_id, quiz, question) {
  client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `
      SELECT * FROM Quizzes WHERE course_id = $1 AND id = $2 ;
    `;

    let values = [course_id, quiz_id];

    let result = await client.query(query, values);
    if (result.rows.length == 0) {
      await client.query("COMMIT");
      return null;
    }

    // 1. Build dynamic update query
    const fields = [];
    let index = 1;
    values = [];

    for (const key in quiz) {
      fields.push(`${key} = $${index}`);
      values.push(quiz[key]);
      index++;
    }

    // 2. Update only if there are fields
    if (fields.length > 0) {
      const updateQuery = `
        UPDATE Quizzes
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING id;
      `;

      values.push(quiz_id);

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        return null;
      }
    }
    // 3. Update tags ONLY if provided
    if (question != null) {
      await client.query(`DELETE FROM Quiz_questions WHERE quiz_id = $1`, [
        quiz_id,
      ]);
      // Insert tags relations
      await insertRelations(quiz_id, question);
    }

    await client.query("COMMIT");

    return { course_id, quiz_id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
module.exports = {
  createQuiz,
  deleteQuizById,
  getQuizById,
  getAllQuizzes,
  updateQuizById,
};
