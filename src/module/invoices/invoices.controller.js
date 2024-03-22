const invoicesService = require('./invoices.service');
const logger = require('../../logger/logger');

const createInvoice = (req, res) => {
    logger.info(`creating invoice`);
    invoicesService.createInvoice(req, res);
}

const fetchInvoices = (req, res) => {
    logger.info("Get Invoice list");
    invoicesService.fetchInvoices(req, res);
}

const getInvoicesById = (req, res) => {
    logger.info("Get Invoice Details");
    invoicesService.getInvoicesById(req, res);
}

const updateInvoceState = (req, res) => {
    logger.info("Update Invoice state");
    invoicesService.updateInvoceState(req, res);
}

const getPdfInvoiceById = (req, res) => {
    logger.info("Get Invoice PDF");
    invoicesService.getPdfInvoiceById(req, res);
}

module.exports = {
    createInvoice,
    fetchInvoices,
    getInvoicesById,
    updateInvoceState,
    getPdfInvoiceById
}