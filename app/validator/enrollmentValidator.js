const { z } = require("zod");
const { getIdZObject, getEnumZObject } = require("./validator");

const updateEnrollmentSchema = z.object({
  student_id: getIdZObject("student_id"),
  status: getEnumZObject("status", ["accepted", "rejected"]),
});

module.exports = { updateEnrollmentSchema };
