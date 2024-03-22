const express = require('express');
const {updateNotification, customerNotifications} = require('../../utils/urlConstant');

const router = express.Router({ mergeParams: true });

const notificationsController = require('./notifications.controller');

router.route("/").get(notificationsController.getNotifications);
router.route(updateNotification).put(notificationsController.updateNotification);
router.route(customerNotifications).get(notificationsController.getCustomerNotifications);

module.exports = router;