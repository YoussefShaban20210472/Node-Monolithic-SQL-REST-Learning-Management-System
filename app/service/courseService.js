const {
  createCourseSchema,
  createUpdateCourseSchema,
} = require("../validator/courseValidator");
const courseModel = require("../model/courseModel");
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
async function getCourseById(id) {
  const course = await courseModel.getCourseById(id);
  if (course == null) {
    throw { status: 404, message: "Course Not Found" };
  }
  return course;
}

async function getFullCourseById(id) {
  const course = await courseModel.getFullCourseById(id);
  if (course == null) {
    throw { status: 404, message: "Course Not Found" };
  }
  return course;
}
async function getAllFullCourses() {
  const courses = await courseModel.getAllFullCourses();
  return courses;
}
async function getAllInstructorFullCourses(instructor_id) {
  const courses = await courseModel.getAllInstructorFullCourses(instructor_id);
  return courses;
}
async function updateCourseById(id, course) {
  // Validate user
  // Schema Validation
  const validatedCourse = createUpdateCourseSchema.parse(course);

  let safeCourse = {};
  let tag = validatedCourse.tag;
  let category = validatedCourse.category;
  const safeFields = [
    "title",
    "description",
    "short_description",
    "start_date",
    "end_date",
  ];
  safeFields.forEach((safeField) => {
    if (validatedCourse[safeField] != null) {
      safeCourse[safeField] = validatedCourse[safeField];
    }
  });
  if (Object.keys(safeCourse).length === 0 && tag == null && category == null) {
    throw {
      status: 400,
      message:
        "You have to provide at least one allowed field to update the course",
    };
  }

  const updatedCourse = await courseModel.updateCourseById(
    id,
    safeCourse,
    tag,
    category,
  );
  if (updatedCourse == null) {
    throw { status: 404, message: "Course Not Found" };
  }
  return updatedCourse;
}
async function deleteCourseById(id) {
  const course = await courseModel.deleteCourseById(id);
  if (course == null) {
    throw { status: 404, message: "Course Not Found" };
  }
  return course;
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
