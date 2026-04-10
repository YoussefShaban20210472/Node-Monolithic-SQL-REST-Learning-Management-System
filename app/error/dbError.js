// errors/handleDbError.js
function handleDbError(error) {
  if (!error.code) return null;

  switch (error.code) {
    case "23505": // unique violation
      return {
        status: 409,
        errors: parseUniqueError(error),
      };

    case "23502": // not null
      return {
        status: 400,
        errors: [
          { property: error.column, message: `${error.column} is required` },
        ],
      };

    case "22P02": // invalid type
      return {
        status: 400,
        errors: [
          { property: error.column, message: `${error.column} must be string` },
        ],
      };

    case "40001": // serialization failure
    case "40P01": // deadlock
      return {
        status: 500,
        errors: [
          {
            message: "Transaction failed, please retry",
          },
        ],
      };

    default:
      return {
        status: 500,
        errors: [{ message: "Database error" }],
      };
  }
}

function parseUniqueError(error) {
  // users_email_key → email
  const parts = error.constraint.split("_");
  const column = parts.slice(1, -1).join("_");
  return [{ property: `${column}`, message: `${column} is already existed` }];
}

module.exports = handleDbError;
