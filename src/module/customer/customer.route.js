const express = require('express');
const router = express.Router({ mergeParams: true });

const customerController = require('./customer.controller');
const { fetchCustomerDetails, createCustomerDetails, updateCustomerDetails, deleteCustomerDetails, searchCustomerById, searchCustomerLike, deleteCustomerDetailsBulk, updateUserStatus, countUserStatus, addCustomerIntoCRM, updateCustomerIntoCRM, addQuotationReq, updateQuotationReq, getQuotationReqByStatus, getQuotationReqListByStatus, getQuotationRequestById, getProfileDetails, updateProfileDetails, updateCompanyDetails, getCustomerByEmailId, getQuotationByCustomerId, getTotalTransactionForOrdersByCustomerId, getTotalTEUForOrdersByCustomerId, getTotalVolumeAmountForOrdersByCustomerId, getQuotationReqestCountByMonth, getQuotationRequestCount, getAllQuotationRequestsByStatus, getFilteredQuotationRequests, companies, createCustomerRequest, getCustomerRequest, getCustomerRequestById } = require('../../utils/urlConstant');

const multer = require('multer');
const { getMulterS3Storage } = require('../../utils/aws');

const upload = multer({
    storage: getMulterS3Storage()
});

router.route(fetchCustomerDetails).get(customerController.fetchCustomerDetails);
router.route(companies).get(customerController.fetchAllCompanies);
router.route(companies).post(customerController.createCompany);
router.route(companies + "/:id").put(customerController.updateCompany);
router.route(updateCustomerDetails).put(customerController.updateCustomerDetails);
router.route(deleteCustomerDetails).delete(customerController.deleteCustomerDetails);
router.route(createCustomerDetails).post(customerController.createCustomerDetails);
router.route(searchCustomerById).get(customerController.searchCustomerById);
router.route(searchCustomerLike).get(customerController.searchCustomerLike);
router.route(deleteCustomerDetailsBulk).delete(customerController.deleteCustomerDetailsBulk);
router.route(updateUserStatus).put(customerController.updateUserStatus);
router.route(countUserStatus).get(customerController.countUserStatus);
router.route(addCustomerIntoCRM).post(customerController.addCustomerIntoCRM);
router.route(getCustomerByEmailId).post(customerController.getCustomerByEmailId);
router.route(updateCustomerIntoCRM).post(customerController.updateCustomerIntoCRM);
router.route(addQuotationReq).post(customerController.addQuotationReq);
router.route(updateQuotationReq).put(customerController.updateQuotationReq);
router.route(getQuotationReqListByStatus).get(customerController.getQuotationReqListByStatus);
router.route(getQuotationRequestById).get(customerController.getQuotationRequestById);
router.route(getFilteredQuotationRequests).post(customerController.getFilteredQuotationRequests);
router.route(getProfileDetails).get(customerController.getProfileDetails);
router.route(updateProfileDetails).post(customerController.updateProfileDetails);
router.route(updateCompanyDetails).post(customerController.updateCompanyDetails);
router.route(getQuotationByCustomerId).get(customerController.getQuotationByCustomerId);
router.route(getTotalTransactionForOrdersByCustomerId).get(customerController.getTotalTransactionForOrdersByCustomerId);
router.route(getTotalTEUForOrdersByCustomerId).get(customerController.getTotalTEUForOrdersByCustomerId);
router.route(getTotalVolumeAmountForOrdersByCustomerId).get(customerController.getTotalVolumeAmountForOrdersByCustomerId);
router.route(getQuotationRequestCount).get(customerController.getQuotationRequestCount);
router.route(getQuotationReqestCountByMonth).get(customerController.getQuotationReqestCountByMonth);
router.route(getAllQuotationRequestsByStatus).get(customerController.getAllQuotationRequestsByStatus);

router.route(createCustomerRequest).post(upload.single('file'),customerController.createCustomerRequest)


router.route(getCustomerRequest).get(customerController.getCustomerRequest);
router.route(getCustomerRequestById).get(customerController.getCustomerRequestById);

module.exports = router;