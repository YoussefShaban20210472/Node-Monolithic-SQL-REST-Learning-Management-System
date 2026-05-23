const { z } = require("zod");
const {
  getStringZObject,
  getDateZObject,
  getNumberZObject,
  checkDuration,
  checkTimeNow,
  getIdZObject,
  getEnumZObject,
} = require("./validator");
function getEmailZObject() {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "email is required"
          : "email must be string",
    })
    .email("Invalid email");
}
function getPasswordZObject() {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "password is required"
          : "password must be string",
    })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        error: (issue) =>
          issue.input.length < 8
            ? "password must be at least 8 letters"
            : "password must contains at least 1 [lowercase letter, uppercase letter, number, special character]",
      },
    );
}
function getPhoneNumberZObject() {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "phone_number is required"
          : "phone_number must be string",
    })
    .regex(/^[0-9]{10,15}$/, "phone_number must be 10-15 digits");
}
function getAddressZObject() {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "address is required"
          : "address must be string",
    })
    .min(4, "address must be at least 4 characters")
    .max(1000, "address must be at maximum 1000 characters")
    .regex(/^\d{1,5}\s\w.\s(\b\w*\b\s){1,2}\w*\.$/, {
      error: (issue) =>
        issue.input.length < 4
          ? "address must be at least 4 letters"
          : issue.input.length > 1000
            ? "address must be at maximum 1000 letters"
            : "address has invalid format",
    });
}
const userSchema = z.object({
  first_name: getStringZObject("first_name", "3", "20"),
  last_name: getStringZObject("last_name", "3", "20"),
  email: getEmailZObject(),
  password: getPasswordZObject(),
  phone_number: getPhoneNumberZObject(),
  address: getAddressZObject(),
  role: getEnumZObject("role", ["student", "instructor", "admin"]),
});
const updateUserSchema = z.object({
  first_name: getStringZObject("first_name", "3", "20").optional(),
  last_name: getStringZObject("last_name", "3", "20").optional(),
  email: getEmailZObject().optional(),
  phone_number: getPhoneNumberZObject().optional(),
  address: getAddressZObject().optional(),
});

module.exports = { userSchema, updateUserSchema };
