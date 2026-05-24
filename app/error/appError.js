const handleZodError = require("./zodError");
const handleRedisError = require("./redisError");
const handleDbError = require("./dbError");
const { handleBusinessError } = require("./businessError");
const handleMulterError = require("./multerError");
function handleAppError(error) {
  return (
    handleMulterError(error) ||
    handleZodError(error) ||
    handleRedisError(error) ||
    handleDbError(error) ||
    handleBusinessError(error) || {
      status: 500,
      errors: [{ message: "Internal server error" }],
    }
  );
}

module.exports = handleAppError;
