const dashboardService = require('./dashboard.service');
const logger = require('../../logger/logger');
require('dotenv').config();

const uploadAndProcessDocument = (req, res) => {
    logger.info(`Get data from Excelsheet ${JSON.stringify(req.body)}`)
    dashboardService.uploadAndProcessDocument(req, res);
}
const getExcelSheetTable = (req, res) => {
    logger.info(`Get data from Excelsheet${JSON.stringify(req.body)}`)
    dashboardService.getExcelSheetTable(req, res);
}

const getExcelSheetTableCronJob = (req, res) => {
    logger.info(`Get data from Excelsheet cron job ${JSON.stringify(req.body)}`)
    dashboardService.getExcelSheetTableCronJob(req, res);
}

const createQuotation = (req, res) => {
    logger.info(`createQuotation : ${JSON.stringify(req.body)}`)
    dashboardService.createQuotation(req, res).then((response) => res.send(response));
}

const quotationCompanyDetails = (req, res) => {
    logger.info(`Quoation Company Details Page API called`)
    dashboardService.quotationCompanyDetails(req, res).then((response) => res.send(response))
}

const insertQuotationCompanyDetails = (req, res) => {
    logger.info(`Insert Quoation Company Details Page API called. ${JSON.stringify(req.body)}`)
    dashboardService.insertQuotationCompanyDetails(req, res).then((response) => res.send(response))
}
const updateQuotationCompanyDetails = (req, res) => {
    logger.info(`Update Quoation Company Details Page API called. ${JSON.stringify(req.body)}`)
    dashboardService.updateQuotationCompanyDetails(req, res).then((response) => res.send(response))
}

const fetchQuotation = (req, res) => {
    logger.info(`fetchQuotation : ${JSON.stringify(req.body)}`)
    dashboardService.fetchQuotation(req, res).then((response) => res.send(response));
}

const updateQuotation = (req, res) => {
    logger.info(`updateQuotation : ${JSON.stringify(req.body)}`)
    dashboardService.updateQuotation(req, res).then((response) => res.send(response));
}

const fetchQuotationById = (req, res) => {
    logger.info(`fetchQuotationById : ${JSON.stringify(req.query.id)}`)
    dashboardService.fetchQuotationById(req, res).then((response) => res.send(response));
}

const onLoadQuotations = (req, res) => {
    logger.info(`onLoadQuotations : ${JSON.stringify(req.query.id)}`)
    dashboardService.onLoadQuotations(req, res).then((response) => res.send(response));
}

const searchQuotationRates = (req, res) => {
    logger.info(`Search quotations: ${JSON.stringify(req.body)}`);
    dashboardService.searchQuotationRates(req, res);
}

const addMyQuotation = (req, res) => {
    logger.info(`Adding my quotation: ${JSON.stringify(req.body)}`);
    dashboardService.addMyQuotation(req, res);
}

const updateMyQuotation = (req, res) => {
    logger.info(`Updating my quotation: ${JSON.stringify(req.body)}`);
    dashboardService.updateMyQuotation(req, res);
}

const getMyQuotations = (req, res) => {
    logger.info(`Get my quotations`);
    dashboardService.getMyQuotations(req, res);
}

const getMyQuotationsByLoggedInUser = (req, res) => {
    logger.info(`Get my quotations by logged in user`);
    dashboardService.getMyQuotationsByLoggedInUser(req, res);
}

const generateMyQuotationPDF = (req, res) => {
    logger.info(`Get my quotations PDF`);
    dashboardService.generateMyQuotationPDF(req, res);
}

const saveMyQuotation = (req, res) => {
    logger.info(`Save my quotations`);
    dashboardService.saveMyQuotation(req, res);
}

const shareMyQuotation = (req, res) => {
    logger.info(`Share my quotations`);
    dashboardService.shareMyQuotation(req, res);
}

const sendFlashRate = (req, res) => {
    logger.info('Send Flash Rate');
    dashboardService.sendFlashRate(req, res);
}

const confirmSearchQuote = (req, res) => {
    logger.info('confirm search quote');
    dashboardService.confirmSearchQuote(req, res);
}

const sendSearchQuote = (req, res) => {
    logger.info('send search quote');
    dashboardService.sendSearchQuote(req, res);
}

const generateAndSendQuotationPDFViaWhatsApp = (req, res) => {
    logger.info(`Get my quotations PDF and send via WhatsApp`);
    dashboardService.generateAndSendQuotationPDFViaWhatsApp(req, res);
}

const generateAndSendQuotationPDFViaMail = (req, res) => {
    logger.info(`Get my quotations PDF and send via Mail`);
    dashboardService.generateAndSendQuotationPDFViaMail(req, res);
}

const getChargesByOriginAndDestination = (req, res) => {
    logger.info(`Get charges`);
    dashboardService.getChargesByOriginAndDestination(req, res);
}

const insertIntoExtraLocalCharges = (req, res) => {
    logger.info(`Insert extra local charges`);
    dashboardService.insertIntoExtraLocalCharges(req, res);
}

const updateExtraLocalCharges = (req, res) => {
    logger.info(`Update extra local charges`)
    dashboardService.updateExtraLocalCharges(req, res);
}

const deleteExtraLocalCharges = (req, res) => {
    logger.info(`Delete extra local charges`)
    dashboardService.deleteExtraLocalCharges(req, res);
}

const getContractNumbers = (req, res) => {
    logger.info('Get contract numbers')
    dashboardService.getContractNumbers(req, res);
}
const getDemurrageAndDetention = (req, res) => {
    logger.info('Get demurrage and detention')
    dashboardService.getDemurrageAndDetention(req, res)
}

const getMonthWiseMyQuotationsCount = (req, res) => {
    logger.info('Get MonthWise MyQuotations Count')
    dashboardService.getMonthWiseMyQuotationsCount(req, res);
}

const getMyQuotationsSummary = (req, res) => {
    logger.info('Get MyQuotations Summary')
    dashboardService.getMyQuotationsSummary(req, res);
}

const getMyQuotationsBySourceAndDestination = (req, res) => {
    logger.info('Get MyQuotations By Source And Destination')
    dashboardService.getMyQuotationsBySourceAndDestination(req, res);
}

const getQuotationsCountForCurrentWeek = (req, res) => {
    logger.info('Get Quotations Count For Current Week')
    dashboardService.getQuotationsCountForCurrentWeek(req, res);
}

const getQuotationsCountForCurrentMonth = (req, res) => {
    logger.info('Get Quotations Count For Current Month')
    dashboardService.getQuotationsCountForCurrentMonth(req, res);
}

const getAllPorts = (req, res) => {
    logger.info('Get All Ports')
    dashboardService.getAllPorts(req, res);
}

const getTierMarginsById = (req, res) => {
    logger.info('Get Tier Margins By Id');
    dashboardService.getTierMarginsById(req, res);
}

const getTierMargins = (req, res) => {
    logger.info('Get Tier Margins');
    dashboardService.getTierMargins(req, res);
}

const updateTierMargins = (req, res) => {
    logger.info('Updated Tier Margins');
    dashboardService.updateTierMargins(req, res);
}
const createTierMargins = (req, res) => {
    logger.info('Added Tier Margins');
    dashboardService.createTierMargins(req, res);
}

const sendMailNotificationForNoRates = (req, res) => {
    logger.info('Send Mail Notification For No Rates');
    dashboardService.sendMailNotificationForNoRates(req, res);
}

const getQuotationsCount = (req, res) => {
    logger.info('getQuotationsCount For Control Tower');
    dashboardService.getQuotationsCount(req, res);
}

const getContractsCount=(req, res)=>{
    logger.info('getContractsCount For Control Tower');
    dashboardService.getContractsCount(req, res);
}

const getQuotationsTrend = (req, res) => {
    logger.info('getQuotationsTrend For Control Tower');
    dashboardService.getQuotationsTrend(req, res);
}

const downloadQuotationAsWordDocument = (req, res) => {
    logger.info('Download Quotation As Word Document');
    dashboardService.downloadQuotationAsWordDocument(req, res);
}

const downloadQuotationAsPDFDocument = (req, res) => {
    logger.info('Download Quotation As PDF Document');
    dashboardService.downloadQuotationAsPDFDocument(req, res);
}

const deleteData = (req, res) => {
    logger.info('Delete Data');
    dashboardService.deleteData(req, res);
}

module.exports = {
    getExcelSheetTable,
    getExcelSheetTableCronJob,
    uploadAndProcessDocument,
    createQuotation,
    fetchQuotation,
    fetchQuotationById,
    updateQuotation,
    onLoadQuotations,
    quotationCompanyDetails,
    updateQuotationCompanyDetails,
    insertQuotationCompanyDetails,
    searchQuotationRates,
    addMyQuotation,
    updateMyQuotation,
    getMyQuotations,
    getMyQuotationsByLoggedInUser,
    generateMyQuotationPDF,
    saveMyQuotation,
    shareMyQuotation,
    sendFlashRate,
    confirmSearchQuote,
    sendSearchQuote,
    generateAndSendQuotationPDFViaWhatsApp,
    generateAndSendQuotationPDFViaMail,
    getChargesByOriginAndDestination,
    insertIntoExtraLocalCharges,
    updateExtraLocalCharges,
    deleteExtraLocalCharges,
    getContractNumbers,
    getDemurrageAndDetention,
    getMonthWiseMyQuotationsCount,
    getMyQuotationsSummary,
    getMyQuotationsBySourceAndDestination,
    getQuotationsCountForCurrentWeek,
    getQuotationsCountForCurrentMonth,
    getAllPorts,
    getTierMargins,
    getTierMarginsById,
    createTierMargins,
    updateTierMargins,
    sendMailNotificationForNoRates,
    getQuotationsCount,
    getContractsCount,
    getQuotationsTrend,
    downloadQuotationAsWordDocument,
    downloadQuotationAsPDFDocument,
    deleteData
};