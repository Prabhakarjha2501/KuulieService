const customerService = require('./customer.service');
const logger = require('../../logger/logger');

const fetchCustomerDetails = (req, res) => {
    logger.info(`fetching customer data`)
    customerService.fetchCustomerDetails(req, res);
}

const fetchAllCompanies = (req, res) => {
    logger.info("fetching companies")
    customerService.getAllCompanies(req, res);
}

const createCompany = (req, res) => {
    logger.info("Create company")
    customerService.createCompany(req, res);
}

const updateCompany = (req, res) => {
    logger.info("Update company")
    customerService.updateCompany(req, res);
}

const updateCustomerDetails = (req, res) => {
    logger.info(`updating customer data`)
    customerService.updateCustomerDetails(req, res);
}

const deleteCustomerDetails = (req, res) => {
    logger.info(`deleting customer data`)
    customerService.deleteCustomerDetails(req, res);
}
const createCustomerDetails = (req, res) => {
    logger.info(`creating customer data`)
    customerService.createCustomerDetails(req, res);
}
const searchCustomerById = (req, res) => {
    logger.info(`fetching customer data`)
    customerService.searchCustomerById(req, res).then((response) => res.send(response));
}


const searchCustomerLike = (req, res) => {
    logger.info(`search customer data`)
    customerService.searchCustomerLike(req, res).then((response) => res.send(response));
}

const deleteCustomerDetailsBulk = (req, res) => {
    logger.info(`deleting customer data in bulk`)
    customerService.deleteCustomerDetailsBulk(req, res);
}

const updateUserStatus = (req, res) => {
    logger.info(`update isactive column`)
    customerService.updateUserStatus(req, res);
}
const countUserStatus = (req, res) => {
    logger.info(`get isactive customer count`)
    customerService.countUserStatus(req, res);
}

const addCustomerIntoCRM = (req, res) => {
    logger.info('Add customer into CRM')
    customerService.addCustomerIntoCRM(req, res);
}

const getCustomerByEmailId = (req, res) => {
    logger.info('Get customer by emailId')
    customerService.getCustomerByEmailId(req, res);
}

const updateCustomerIntoCRM = (req, res) => {
    logger.info('Update customer into CRM')
    customerService.updateCustomerIntoCRM(req, res);
}

const addQuotationReq = (req, res) => {
    logger.info(`Add quotation request`)
    customerService.addQuotationReq(req, res);
}
const updateQuotationReq = (req, res) => {
    logger.info(`Update quotation request`)
    customerService.updateQuotationReq(req, res);
}

const getQuotationReqListByStatus = (req, res) => {
    logger.info('Fetch quotation requests')
    customerService.getQuotationReqListByStatus(req, res);
}

const getQuotationRequestById = (req, res) => {
    logger.info('Fetch quotation request by id')
    customerService.getQuotationRequestById(req, res);
}

const getFilteredQuotationRequests = (req, res) => {
    logger.info('getFilteredQuotationRequests')
    customerService.getFilteredQuotationRequests(req, res);
}

const getQuotationRequestCount = (req, res) => {
    logger.info('Fetch quotation request count')
    customerService.getQuotationRequestCount(req, res);  
}    

const getQuotationReqestCountByMonth = (req, res) => {
    logger.info('Fetch quotation request count by Month')
    customerService.getQuotationReqestCountByMonth(req, res);  
}

const getProfileDetails = (req, res) => {
    logger.info('get profile details')
    customerService.getProfileDetails(req, res)
}

const updateProfileDetails = (req, res) => {
    logger.info('update profile details')
    customerService.updateProfileDetails(req, res).then((response) => res.send(response))
}

const updateCompanyDetails = (req, res) => {
    logger.info('update company details details')
    customerService.updateCompanyDetails(req, res).then((response) => res.send(response))
}

const getQuotationByCustomerId = (req, res) => {
    logger.info('Fetch Quotations by customer id');
    customerService.getQuotationByCustomerId(req, res);
}

const getTotalTransactionForOrdersByCustomerId = (req, res) => {
    logger.info('Fetch Total Volume by customer id');
    customerService.getTotalTransactionForOrdersByCustomerId(req, res);
}

const getTotalTEUForOrdersByCustomerId = (req, res) => {
    logger.info('Fetch Total TUE by Customer id');
    customerService.getTotalTEUForOrdersByCustomerId(req, res);
}

const getTotalVolumeAmountForOrdersByCustomerId = (req, res) => {
    logger.info('Fetch Total Volume by Customer id');
    customerService.getTotalVolumeAmountForOrdersByCustomerId(req, res);
}

const getAllQuotationRequestsByStatus = (req, res) => {
    logger.info('getAllQuotationRequestsByStatus');
    customerService.getAllQuotationRequestsByStatus(req, res);
}

const createCustomerRequest = (req, res) => {
    logger.info('Added Customer Request');
    customerService.createCustomerRequest(req, res);
}

const getCustomerRequest = (req, res) => {
    logger.info('Customer Request');
    customerService.getCustomerRequest(req, res);
}

const getCustomerRequestById = (req, res) => {
    logger.info('Customer Request By Id');
    customerService.getCustomerRequestById(req, res);
}
module.exports = {
    fetchCustomerDetails,
    updateCustomerDetails,
    deleteCustomerDetails,
    searchCustomerById,
    createCustomerDetails,
    searchCustomerLike,
    deleteCustomerDetailsBulk,
    updateUserStatus,
    countUserStatus,
    addCustomerIntoCRM,
    getCustomerByEmailId,
    updateCustomerIntoCRM,
    addQuotationReq,
    updateQuotationReq,
    getQuotationReqListByStatus,
    getQuotationRequestById,
    getProfileDetails,
    updateProfileDetails,
    updateCompanyDetails,
    getQuotationByCustomerId,
    getTotalTransactionForOrdersByCustomerId,
    getTotalTEUForOrdersByCustomerId,
    getTotalVolumeAmountForOrdersByCustomerId,
    getQuotationRequestCount,
    getQuotationReqestCountByMonth,
    getAllQuotationRequestsByStatus,
    getFilteredQuotationRequests,
    fetchAllCompanies,
    createCustomerRequest,
    getCustomerRequest,
    getCustomerRequestById,
    createCompany,
    updateCompany
};