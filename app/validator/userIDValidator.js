const { z } = require(`zod`);
const { getIdZObject } = require("./validator");

const studentIDSchema = z.object(
  { student_id: getIdZObject("student_id") },
  "Json Body is required",
);
const instructorIDSchema = z.object(
  { instructor_id: getIdZObject("instructor_id") },
  "Json Body is required",
);

module.exports = { studentIDSchema, instructorIDSchema };
