const { createCourseSchema } = require("../validator/courseValidator");
const courseModel = require("../Model/courseModel");
async function createCourse(instructor_id, course) {
  // Validate course

  // Schema Validation
  const validatedCourse = createCourseSchema.parse(course);

  // Create course
  const createdCourse = await courseModel.createCourse(
    instructor_id,
    validatedCourse,
  );
  return createdCourse;
}

module.exports = {
  createCourse,
};
