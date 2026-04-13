const { z } = require("zod");

const createUserSchema = z.object({
  first_name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "first_name is required"
          : "first_name must be string",
    })
    .regex(/^[A-Za-z]{3,20}$/, {
      error: (issue) =>
        issue.input.length < 3
          ? "first_name must be at least 3 letters"
          : issue.input.length > 20
            ? "first_name must be at maximum 20 letters"
            : "first_name must be only letters",
    }),
  last_name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "last_name is required"
          : "last_name must be string",
    })
    .regex(/^[A-Za-z]{3,20}$/, {
      error: (issue) =>
        issue.input.length < 3
          ? "last_name must be at least 3 letters"
          : issue.input.length > 20
            ? "last_name must be at maximum 20 letters"
            : "last_name must be only letters",
    }),
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "email is required"
          : "email must be string",
    })
    .email("Invalid email"),
  password: z
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
    ),
  phone_number: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "phone_number is required"
          : "phone_number must be string",
    })
    .regex(/^[0-9]{10,15}$/, "phone_number must be 10-15 digits"),
  address: z
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
    }),
  role: z.enum(["student", "instructor", "admin"], {
    error: (issue) =>
      issue.input === undefined
        ? "role is required"
        : typeof issue.input !== "string"
          ? "role must be string"
          : "role must be one of these [admin, instructor, student]",
  }),
});

const createUserUpdateSchema = z.object({
  first_name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "first_name is required"
          : "first_name must be string",
    })
    .regex(/^[A-Za-z]{3,20}$/, {
      error: (issue) =>
        issue.input.length < 3
          ? "first_name must be at least 3 letters"
          : issue.input.length > 20
            ? "first_name must be at maximum 20 letters"
            : "first_name must be only letters",
    })
    .optional(),
  last_name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "last_name is required"
          : "last_name must be string",
    })
    .regex(/^[A-Za-z]{3,20}$/, {
      error: (issue) =>
        issue.input.length < 3
          ? "last_name must be at least 3 letters"
          : issue.input.length > 20
            ? "last_name must be at maximum 20 letters"
            : "last_name must be only letters",
    })
    .optional(),
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "email is required"
          : "email must be string",
    })
    .email("Invalid email")
    .optional(),

  phone_number: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "phone_number is required"
          : "phone_number must be string",
    })
    .regex(/^[0-9]{10,15}$/, "phone_number must be 10-15 digits")
    .optional(),
  address: z
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
    })
    .optional(),
});

module.exports = { createUserSchema, createUserUpdateSchema };
