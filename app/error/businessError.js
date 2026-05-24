class BusinessError {
  constructor(status, message) {
    this.status = status;
    this.message = message;
  }
  getError() {
    return { status: this.status, errors: [{ message: this.message }] };
  }
}
class ObjectNotFound extends BusinessError {
  constructor(object) {
    super(404, `${object} Not Found`);
  }
}
class BadRequest extends BusinessError {
  constructor(message) {
    super(400, message);
  }
}
class AccessDeny extends BusinessError {
  constructor() {
    super(401, "Access Denied");
  }
}
class Confilct extends BusinessError {
  constructor(message) {
    super(409, message);
  }
}
function handleBusinessError(error) {
  if (!(error instanceof BusinessError)) return null;
  return error.getError();
}

module.exports = {
  ObjectNotFound,
  BadRequest,
  AccessDeny,
  Confilct,
  handleBusinessError,
};
