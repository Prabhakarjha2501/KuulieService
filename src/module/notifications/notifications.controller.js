const logger = require('../../logger/logger');
const notificationsService = require('./notifications.service');
require('dotenv').config();

module.exports.getNotifications = (req, res) => {
    logger.info("Get notification list");
    notificationsService.getNotifications(req, res);
}

module.exports.getCustomerNotifications = (req, res) => {
    logger.info("Get customer notification list");
    notificationsService.getCustomerNotifications(req, res);
}

module.exports.updateNotification = (req, res) => {
    notificationsService.updateNotification(req, res);
}
