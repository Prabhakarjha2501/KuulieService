const cron = require('node-cron');
const { getAndProcessQuotationRatesForAll, getAndProcessLocalChargesForAll, getAndProcessDndForAll, doGetAndProcessPortsDataExcel, getAndProcessQuotationonlineRatesForAll, contractRateExpires } = require('../module/zoho/zoho.service');
const { callGeekYumAPIAndInsertSpotRates } = require('../module/dashboard/spot-rate.service');
let isExecuting = false;
module.exports.initializeSchedulers = () => {
    cron.schedule('0 0 0 * * *', async () => {
        try {
            console.log('******************************* Started - Quotation Rate Zoho Excel Import Job ******************************* ', new Date());
            await getAndProcessQuotationRatesForAll();
            console.log('******************************* Completed - Quotation Rate Zoho Excel Import Job ******************************* ', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - Quotation Rate Zoho Excel Import Job ******************************* ', new Date());
        }
    });
    cron.schedule('0 0 1 * * *', async () => {
        try {
            console.log('******************************* Started - Quotation Local Charges Zoho Excel Import Job ******************************* ', new Date());
            await getAndProcessLocalChargesForAll();
            console.log('******************************* Completed - Quotation Local Charges Zoho Excel Import Job ******************************* ', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - Quotation Local Charges Zoho Excel Import Job ******************************* ', new Date());
        }
    });
    cron.schedule('0 0 2 * *', async () => {
        try {
            console.log('******************************* Started - Quotation Dnd Zoho Excel Import Job ******************************* ', new Date());
            await getAndProcessDndForAll();
            console.log('******************************* Completed - Quotation Dnd Zoho Excel Import Job ******************************* ', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - Quotation Dnd Zoho Excel Import Job ******************************* ', new Date());
        }
    });
    cron.schedule('0 0 0 * * *', async () => {
        try {
            console.log('******************************* Started - Ports Data Zoho Excel Import Job ******************************* ', new Date());
            await doGetAndProcessPortsDataExcel();
            console.log('******************************* Completed - Ports Data Zoho Excel Import Job ******************************* ', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - Ports Data Zoho Excel Import Job ******************************* ', new Date());
        }
    });
    cron.schedule('0 0 0 * * * ', async () => {
        try {
            console.log('******************************* Started - Quotation Online Rate Zoho Excel Import Job ******************************* ', new Date());
            await getAndProcessQuotationonlineRatesForAll();
            console.log('******************************* Completed - Quotation Online Rate Zoho Excel Import Job ******************************* ', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - Quotation Online Rate Zoho Excel Import Job ******************************* ', new Date());
        }
    });
    cron.schedule('0 0 0 * * *', async () => {
        try {
            console.log('******************************* Started', new Date());
            await contractRateExpires();
            console.log('******************************* Completed', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error', new Date());
        }
    });

    cron.schedule('0 0 0 * * *', async () => {
        try {
            console.log('******************************* Started - SPOT RATE', new Date());
            await callGeekYumAPIAndInsertSpotRates(process.env.LUINA_DB_CONNECTION_STRING, true);
            console.log('******************************* Completed - SPOT RATE', new Date());
        } catch (error) {
            console.log(error);
            console.log('******************************* Error - SPOT RATE', new Date());
        }
    });
};