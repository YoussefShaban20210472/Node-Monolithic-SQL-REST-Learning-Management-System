const { z } = require("zod");
const { getIdZObject, getEnumZObject } = require("./validator");

const notificationSchema = z.object({
  user_id: getIdZObject("user_id"),
  status: getEnumZObject("status", ["read", "unread", "all"]).optional(),
});

module.exports = { notificationSchema };
