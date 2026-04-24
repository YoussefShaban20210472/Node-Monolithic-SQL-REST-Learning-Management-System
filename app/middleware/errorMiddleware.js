const handleAppError = require("../error/appError");
function errorAppHandler(error, req, res, next) {
  const result = handleAppError(error);
  res.status(result.status).json({ errors: result.errors });
}

module.exports = errorAppHandler;
