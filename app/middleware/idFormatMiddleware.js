function idFormatMiddleware(req, res, next) {
  for (const key in req.params) {
    if (!key.includes("_id")) continue;
    const id = req.params[key];
    const isNum = /^\d+$/.test(id);
    if (id && !isNum) {
      throw { status: 400, message: `${key} must be integer` };
    }
  }
  next();
}

module.exports = idFormatMiddleware;
