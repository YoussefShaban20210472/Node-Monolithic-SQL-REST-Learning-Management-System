const questionBankService = require("../service/questionBankService");
async function createQuestionBank(req, res) {
  const course_id = req.params.course_id;
  const body = req.body;
  const questionBank = await questionBankService.createQuestionBank(
    course_id,
    body,
  );
  res.status(201).json({ question: questionBank });
}
async function deleteQuestionBankById(req, res) {
  const course_id = req.params.course_id;
  const question_id = req.params.question_id;
  const _ = await questionBankService.deleteQuestionBankById(
    course_id,
    question_id,
  );
  res.status(200).json({ message: "question bank deleted successfully" });
}
async function getQuestionBankById(req, res) {
  const course_id = req.params.course_id;
  const question_id = req.params.question_id;
  const questionBank = await questionBankService.getQuestionBankById(
    course_id,
    question_id,
  );
  res.status(200).json({ question: questionBank });
}

async function getAllQuestionsBank(req, res) {
  const course_id = req.params.course_id;
  const questionsBank =
    await questionBankService.getAllQuestionsBank(course_id);
  res.status(200).json({ questions: questionsBank });
}

async function updateQuestionBankById(req, res) {
  const course_id = req.params.course_id;
  const question_id = req.params.question_id;
  const body = req.body;

  const _ = await questionBankService.updateQuestionBankById(
    course_id,
    question_id,
    body,
  );
  res.status(200).json({ message: "question bank updated successfully" });
}
module.exports = {
  createQuestionBank,
  deleteQuestionBankById,
  getQuestionBankById,
  getAllQuestionsBank,
  updateQuestionBankById,
};
