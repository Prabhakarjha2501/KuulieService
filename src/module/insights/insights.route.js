const express = require('express');
const { getOnlineUsers,  getUserSessions } = require('../../utils/urlConstant');

const router = express.Router({ mergeParams: true });

const insightsController = require('./insights.controller');

router.route(getOnlineUsers).get(insightsController.getOnlineusers);
router.route(getUserSessions).get(insightsController.getUserSessions);

module.exports = router;