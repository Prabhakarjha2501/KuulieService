const zohoService = require('./zoho.service');
const logger = require('../../logger/logger');
const { callGeekYumAPIAndInsertSpotRates } = require('../dashboard/spot-rate.service');
require('dotenv').config();

const getAndProcessQuotationRateExcel = (req, res) => {
    logger.info("getAndProcessQuotationRateExcel");
    zohoService.getAndProcessQuotationRateExcel(req, res);
}

const contractRateExpires = (req, res) => {
    logger.info("contractRateExpires");
    zohoService.contractRateExpires(req, res);
}

const startCroneJobs = (req, res) => {
    const { rates, charges, dnds, geekyum, ports } = req.body;
    logger.info("startCroneJobs");
    console.log(req.body)
    if (rates) {
        zohoService.getAndProcessQuotationRatesForAll();
    }
    if (charges) {
        zohoService.getAndProcessLocalChargesForAll();
    }
    if (dnds) {
        zohoService.getAndProcessDndForAll();
    }
    /*
    if (onlineRates || rates) {
        zohoService.getAndProcessQuotationonlineRatesForAll();
    }
    */
    if (ports || rates) {
        zohoService.doGetAndProcessPortsDataExcel();
    }
    if (geekyum) {
        callGeekYumAPIAndInsertSpotRates(process.env.LUINA_DB_CONNECTION_STRING, true);
    }
    res.status(200).json({ message: "Crone Jobs Started" });
}

module.exports = {
    getAndProcessQuotationRateExcel,
    startCroneJobs,
    contractRateExpires
};