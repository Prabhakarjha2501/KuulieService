const express = require('express');
const router = express.Router({ mergeParams: true });

const allocationController = require('./allocation.controller');
const { carrierAllocation, downloadExcelPath, fetchCarrierAllocation, fetchWeekAllocation, searchAllocationById, searchAllocationLike, carrierAllocationDefineTargetValue, updateCarrierAllocation, onLoadCarrierAllocation, deleteTargetValues, updateTargetValues, quotationCompanyDetails, insertQuotationCompanyDetails, updateQuotationCompanyDetails } = require('../../utils/urlConstant');

// Create new carrier allocation (When click on ContinueButton)
router.route(carrierAllocation).post(allocationController.carrierAllocationNew);

// Update carrier allocation's values
router.route(updateCarrierAllocation).put(allocationController.updateCarrierAllocation);

// Update carrier allocation's target values
router.route(updateTargetValues).put(allocationController.updateTargetValues);
 
// Get all created Carrier allocation in the System 
router.route(fetchCarrierAllocation).get(allocationController.fetchAllCarrierAllocation);

// Get all Week Carrier allocation in the System 
router.route(fetchWeekAllocation).get(allocationController.fetchWeekAllocation);

// search carrier allocation in the System 
router.route(searchAllocationById).get(allocationController.searchAllocationById);

// search allocation in the System with column
router.route(searchAllocationLike).get(allocationController.searchAllocationLike);

// Delete carrier allocation's target values
router.route(deleteTargetValues).delete(allocationController.deleteTargetValues);

// Define target Values
router.route(carrierAllocationDefineTargetValue).post(allocationController.carrierAllocationNewDefineTargetValues);

// onLoad carrier allocation page
router.route(onLoadCarrierAllocation).get(allocationController.onLoadCarrierAllocation);

router.route(downloadExcelPath).get(allocationController.downloadExcel);

// Get quotation details
module.exports = router;