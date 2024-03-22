const express = require('express');
const router = express.Router({ mergeParams: true });

const zohoController = require('./zoho.controller');

const { getAndProcessQuotationRateExcel, startCroneJobs,contractRateExpires } = require('../../utils/urlConstant');

router.route(getAndProcessQuotationRateExcel).get(zohoController.getAndProcessQuotationRateExcel);

router.route(startCroneJobs).post(zohoController.startCroneJobs);

router.route(contractRateExpires).post(zohoController.contractRateExpires);

module.exports = router;