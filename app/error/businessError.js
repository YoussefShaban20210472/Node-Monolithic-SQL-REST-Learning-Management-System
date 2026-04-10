function handleBusinessError(error) {
  if (!error.status) return null;
  return { status: error.status, errors: [{ message: error.message }] };
}

module.exports = handleBusinessError;
