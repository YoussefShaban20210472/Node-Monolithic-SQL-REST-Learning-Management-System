const notificationService = require("../service/notificationService");
async function getNotifications(req, res) {
  let body = req.body;
  try {
    if (req.user.role != "admin") {
      body["user_id"] = req.user.id;
    }
  } catch {}

  const notifications = await notificationService.getNotifications(body);

  res.status(200).json({ notifications });
}

module.exports = {
  getNotifications,
};
