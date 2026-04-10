const zodError = require("./zodError");
const redisError = require("./redisError");
const dbError = require("./dbError");
const businessError = require("./businessError");
function handleAppError(error) {
  return (
    zodError(error) ||
    redisError(error) ||
    dbError(error) ||
    businessError(error) || {
      status: 500,
      errors: [{ message: "Internal server error" }],
    }
  );
}

module.exports = handleAppError;
