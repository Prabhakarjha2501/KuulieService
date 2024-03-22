const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({
  storage: storage, limits: {
    fileSize: 100000000
  }
})

const dashboardController = require('./dashboard.controller');
const { dashboardBasePath, quotationSearchRates, QuotationBasePath, QuotationCreateBasePath, QuotationUpdateBasePath, QuotationBasePathById, OnLoadQoutation,
  quotationCompanyDetails, insertQuotationCompanyDetails, updateQuotationCompanyDetails,
  myQuotations, myQuotationsByCurrentUser, myQuotationsWithIdParam, downloadMyQuotationPDF, saveMyQuotation, shareMyQuotationViaWhatsApp, shareMyQuotationViaMail,
  QuotationGetCharges, QuotationInsertExtraLocalCharges, QuotationUpdateExtraLocalCharges, QuotationDeleteExtraLocalCharges,
  getContractNumbers, demurrageAndDetention, myQuotationsAnalyticsMonthWise, myQuotationsAnalyticsSummary, myQuotationsAnalyticsMaxPortSummary, myQuotationsAnalyticsForCurrentWeek, myQuotationsAnalyticsForCurrentMonth, allPortsPath, shareMyQuotation, sendFlashRate, confirmSearchQuote, tierMargins, sendMailNotificationForNoRates, sendSearchQuote, createTierMargins,tierMarginsById,updateTierMargins, croneJobs, getQuotationsCount, getQuotationsTrend, getContractsCount} = require('../../utils/urlConstant');

router.route(dashboardBasePath + "/:clientId").post(upload.single('file'), dashboardController.uploadAndProcessDocument);
router.route(dashboardBasePath).post(upload.single('file'), dashboardController.uploadAndProcessDocument);
router.route(dashboardBasePath + "/:clientId").get(dashboardController.getExcelSheetTable);
router.route(dashboardBasePath).get(dashboardController.getExcelSheetTable);
router.route(croneJobs +"/:clientId").get(dashboardController.getExcelSheetTableCronJob)

//Quatiation
router.route(QuotationBasePathById).get(dashboardController.fetchQuotationById);
router.route(QuotationBasePath).get(dashboardController.fetchQuotation);
router.route(QuotationCreateBasePath).post(dashboardController.createQuotation);
router.route(QuotationUpdateBasePath).post(dashboardController.updateQuotation);
router.route(QuotationUpdateBasePath).post(dashboardController.updateQuotation);
router.route(OnLoadQoutation).get(dashboardController.onLoadQuotations);

//Tier Margine
router.route(tierMarginsById).get(dashboardController.getTierMarginsById);
router.route(tierMargins).get(dashboardController.getTierMargins);
router.route(createTierMargins).post(dashboardController.createTierMargins);
router.route(updateTierMargins).put(dashboardController.updateTierMargins);


router.route(quotationCompanyDetails).get(dashboardController.quotationCompanyDetails);
router.route(insertQuotationCompanyDetails).post(dashboardController.insertQuotationCompanyDetails);
router.route(updateQuotationCompanyDetails).post(dashboardController.updateQuotationCompanyDetails);
router.route(quotationSearchRates).post(dashboardController.searchQuotationRates);
router.route(sendMailNotificationForNoRates).post(dashboardController.sendMailNotificationForNoRates);

//My Quotation
router.route(myQuotations).post(dashboardController.addMyQuotation);
router.route(myQuotations).get(dashboardController.getMyQuotations);
router.route(myQuotationsWithIdParam).put(dashboardController.updateMyQuotation);
router.route(myQuotationsByCurrentUser).get(dashboardController.getMyQuotationsByLoggedInUser);
router.route(downloadMyQuotationPDF).post(dashboardController.generateMyQuotationPDF);
router.route(saveMyQuotation).post(dashboardController.saveMyQuotation);
router.route(shareMyQuotation).post(dashboardController.shareMyQuotation);
router.route(sendFlashRate).post(dashboardController.sendFlashRate);
router.route(confirmSearchQuote).post(dashboardController.confirmSearchQuote);
router.route(sendSearchQuote).post(dashboardController.sendSearchQuote);
router.route(shareMyQuotationViaWhatsApp).post(dashboardController.generateAndSendQuotationPDFViaWhatsApp);
router.route(shareMyQuotationViaMail).post(dashboardController.generateAndSendQuotationPDFViaMail);
router.route(myQuotationsAnalyticsMonthWise).get(dashboardController.getMonthWiseMyQuotationsCount);
router.route(myQuotationsAnalyticsSummary).get(dashboardController.getMyQuotationsSummary);
router.route(myQuotationsAnalyticsMaxPortSummary).get(dashboardController.getMyQuotationsBySourceAndDestination);
router.route(myQuotationsAnalyticsForCurrentWeek).get(dashboardController.getQuotationsCountForCurrentWeek);
router.route(myQuotationsAnalyticsForCurrentMonth).get(dashboardController.getQuotationsCountForCurrentMonth);

router.route(getQuotationsCount).get(dashboardController.getQuotationsCount);
router.route(getContractsCount).get(dashboardController.getContractsCount);
router.route(getQuotationsTrend).post(dashboardController.getQuotationsTrend);

//Local Charges 
router.route(QuotationGetCharges).post(dashboardController.getChargesByOriginAndDestination);
router.route(QuotationInsertExtraLocalCharges).post(dashboardController.insertIntoExtraLocalCharges);
router.route(QuotationDeleteExtraLocalCharges).delete(dashboardController.deleteExtraLocalCharges);
router.route(QuotationUpdateExtraLocalCharges).put(dashboardController.updateExtraLocalCharges);
router.route(getContractNumbers).get(dashboardController.getContractNumbers);
router.route(demurrageAndDetention).post(dashboardController.getDemurrageAndDetention);
router.route(allPortsPath).get(dashboardController.getAllPorts);
router.route('/quotation/download/word').post(dashboardController.downloadQuotationAsWordDocument);
router.route('/quotation/download/pdf').post(dashboardController.downloadQuotationAsPDFDocument);

router.route(dashboardBasePath +"/:clientId").patch(dashboardController.deleteData)

module.exports = router;