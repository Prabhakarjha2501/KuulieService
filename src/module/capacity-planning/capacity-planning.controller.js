const logger = require('../../logger/logger');
const capacityPlanningService = require('./capacity-planning.service');
require('dotenv').config();

module.exports.createAllocation = (req, res) => {
    capacityPlanningService.createAllocation(req, res);
}

module.exports.getAllAllocations = (req, res) => {
    capacityPlanningService.getAllAllocations(req, res);
}

module.exports.updateAllocationPerCustomer = (req, res) => {
    capacityPlanningService.updateAllocationPerCustomer(req, res);
}

module.exports.getAllAllocationPerCustomerByAllocationId = (req, res) => {
    capacityPlanningService.getAllAllocationPerCustomerByAllocationId(req, res);
}

module.exports.getAllCustomerAllocations = (req, res) => {
    capacityPlanningService.getAllCustomerAllocations(req, res);
}

module.exports.getWeekwiseAllocationByAllocationId = (req, res) => {
    capacityPlanningService.getWeekwiseAllocationByAllocationId(req, res);
}

module.exports.updateWeekwiseAllocationByAllocationId = (req, res) => {
    capacityPlanningService.updateWeekwiseAllocationByAllocationId(req, res);
}

module.exports.getAllocationReportExcel = (req, res) => {
    capacityPlanningService.getAllocationReportExcel(req, res);
}

module.exports.importAllocationsViaExcel = (req, res) => {
    capacityPlanningService.importAllocationsViaExcel(req, res);
}

module.exports.getSpaceUtilization = (req, res) => {
    capacityPlanningService.getSpaceUtilization(req, res);
}

module.exports.getCustomerWiseAllocation = (req, res) => {
    capacityPlanningService.getCustomerWiseAllocation(req, res);
}

module.exports.getPlanVsActualSummary = (req, res) => {
    capacityPlanningService.getPlanVsActualSummary(req, res);
}

module.exports.getPlanVsActual = (req, res) => {
    capacityPlanningService.getPlanVsActual(req, res);
}
