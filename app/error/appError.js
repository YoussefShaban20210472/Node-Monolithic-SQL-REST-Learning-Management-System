const zodError = require("./zodError");
const redisError = require("./redisError");
const dbError = require("./dbError");
const businessError = require("./businessError");
const handleMulterError = require("./multerError");
function handleAppError(error) {
  return (
    handleMulterError(error) ||
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
