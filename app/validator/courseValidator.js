const { z } = require("zod");

const {
  HALF_HOUR,
  ONE_DAY,
  SEVEN_DAYS,
  ONE_YEAR,
  getStringZObject,
  getDateZObject,
  getNumberZObject,
  getArrayZObject,
  getIdZObject,
  checkDuration,
  checkTimeNow,
  checkTimeBetweenNowAndYear,
} = require("./validator");

const courseSchema = z
  .object({
    instructor_id: getIdZObject("instructor_id"),
    title: getStringZObject("title", "5", "255"),
    description: getStringZObject("description", "20", "99999999999"),
    short_description: getStringZObject("short_description", "20", "500"),
    start_date: getDateZObject("start_date").refine(
      checkTimeBetweenNowAndYear,
      {
        message: "start_date must be between now and one year from now",
      },
    ),
    end_date: getDateZObject("end_date"),
    tag: getArrayZObject("tag", "1", "255"),
    category: getArrayZObject("category", "1", "255"),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "days"));
const updateCourseSchema = z
  .object({
    title: getStringZObject("title", "5", "255").optional(),
    description: getStringZObject(
      "description",
      "20",
      "99999999999",
    ).optional(),
    short_description: getStringZObject(
      "short_description",
      "20",
      "500",
    ).optional(),
    start_date: getDateZObject("start_date")
      .refine(checkTimeBetweenNowAndYear, {
        message: "start_date must be between now and one year from now",
      })
      .optional(),
    end_date: getDateZObject("end_date").optional(),
    tag: getArrayZObject("tag", "1", "255").optional(),
    category: getArrayZObject("category", "1", "255").optional(),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "days"));

module.exports = { courseSchema, updateCourseSchema };
