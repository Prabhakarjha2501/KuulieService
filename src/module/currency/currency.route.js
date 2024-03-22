const express = require('express');
const router = express.Router({ mergeParams: true });
const currencyController = require('./currency.controller');
const { createCurrency,getCurrencyData,updateCurrencyData,getCurrencyDataById } = require('../../utils/urlConstant');


router.route("/").post(currencyController.createCurrency);
router.route(updateCurrencyData).put(currencyController.updateCurrencyData);
router.route(getCurrencyData).get(currencyController.getCurrenciesInfo);
router.route(getCurrencyDataById).get(currencyController.getChargeById);


module.exports = router;