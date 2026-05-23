const { z } = require("zod");
const {
  HALF_HOUR,
  ONE_DAY,
  SEVEN_DAYS,
  ONE_YEAR,
  getStringZObject,
  getDateZObject,
  getNumberZObject,
  checkDuration,
  checkTimeNow,
} = require("./validator");
const lessonSchema = z
  .object({
    title: getStringZObject("title", "5", "255"),
    description: getStringZObject("description", "20", "99999999999"),
    start_date: getDateZObject("start_date").refine(checkTimeNow, {
      message: "start_date must be at least now",
    }),
    end_date: getDateZObject("end_date"),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "minutes"));
const updateLessonSchema = z
  .object({
    title: getStringZObject("title", "5", "255").optional(),
    description: getStringZObject(
      "description",
      "20",
      "99999999999",
    ).optional(),
    start_date: getDateZObject("start_date")
      .refine(checkTimeNow, {
        message: "start_date must be at least now",
      })
      .optional(),
    end_date: getDateZObject("end_date").optional(),
  })
  .superRefine((data, ctx) => checkDuration(data, ctx, "minutes"));

module.exports = {
  lessonSchema,
  updateLessonSchema,
};
