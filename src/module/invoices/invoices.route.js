const express = require('express');
const router = express.Router({ mergeParams: true });

const invoicesController = require('./invoices.controller');
const { createInvoice, fetchInvoices, updateInvoceState, getInvoicesById, getPdfInvoiceById } = require('../../utils/urlConstant');

router.route(createInvoice).post(invoicesController.createInvoice);
router.route(fetchInvoices).get(invoicesController.fetchInvoices);
router.route(getInvoicesById).get(invoicesController.getInvoicesById);
router.route(updateInvoceState).put(invoicesController.updateInvoceState);
router.route(getPdfInvoiceById).get(invoicesController.getPdfInvoiceById);

module.exports = router;