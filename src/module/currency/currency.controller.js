const currencyService = require('./currency.service');
const logger = require('../../logger/logger');
require('dotenv').config();

const createCurrency = (req, res) => {
    logger.info(`Add Charges`);
    currencyService.createCurrency(req, res);
};

const getCurrenciesInfo = (req, res) => {
    logger.info("Get Currency List");
    currencyService.getCurrenciesInfo(req, res);
}

const getChargeById = (req, res) => {
    logger.info("Get Currency List by Id");
    currencyService.getChargeById(req, res);
}

const updateCurrencyData = (req, res) => {
    logger.info("Update Local charge");
    currencyService.updateCurrencyData(req, res);
}


module.exports = {
    createCurrency,
    getCurrenciesInfo,
    updateCurrencyData,
    getChargeById
}