const trackAndTraceService = require('./trackAndTrace.service');
const logger = require('../../logger/logger');
require('dotenv').config();
const trackAndTraceBillOfLoadingResult = (req, res) => {
    logger.info(`Fetch Schedule Ports`);
    trackAndTraceService.trackAndTraceBillOfLoadingResult(req, res).then((response) => res.send(response));
}

module.exports = {
    trackAndTraceBillOfLoadingResult,
};