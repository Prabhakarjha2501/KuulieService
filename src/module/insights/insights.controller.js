const logger = require('../../logger/logger');
const insightsService = require('./insights.service');
require('dotenv').config();

module.exports.getOnlineusers = (req, res) => {
    logger.info("Get list of online users");
   insightsService.getOnlineUsers(req,res);
}


module.exports.getUserSessions =(req,res) =>{
    logger.info("get top 5 user today spent time on web page");
    insightsService.getUserSession(req,res);
}
