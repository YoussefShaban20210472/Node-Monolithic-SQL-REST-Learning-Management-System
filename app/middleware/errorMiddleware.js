const handleAppError = require("../error/appError");
function errorAppHandler(error, req, res, next) {
  console.log(error);
  const result = handleAppError(error);
  if (result.status == 500) console.log(error);
  res.status(result.status).json({ errors: result.errors });
}

module.exports = errorAppHandler;
