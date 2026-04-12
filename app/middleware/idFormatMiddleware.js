function idFormatMiddleware(req, res, next) {
  const id = req.params.id;
  const isNum = /^\d+$/.test(id);
  if (id && !isNum) {
    throw { status: 400, message: "id must be integer" };
  }
  next();
}

module.exports = idFormatMiddleware;
