function setErrorInsideRequestMiddleware(error, req, _, next) {
  req.fileError = error;
  next();
}

module.exports = setErrorInsideRequestMiddleware;
