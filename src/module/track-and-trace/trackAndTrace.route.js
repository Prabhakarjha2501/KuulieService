const express = require('express');
const router = express.Router({ mergeParams: true });

const trackAndTraceController = require('./trackAndTrace.controller');
const { trackAndTraceBillOfLoading} = require('../../utils/urlConstant');

router.route(trackAndTraceBillOfLoading).post(trackAndTraceController.trackAndTraceBillOfLoadingResult);


module.exports = router;