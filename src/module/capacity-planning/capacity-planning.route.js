const express = require('express');
const { capacityPlanningAllocationPath, capacityPlanningCustomerAllocationPath, capacityPlanningAllocationReportExcelDownloadPath, capacityPlanningAllocationReportExcelImportPath,
    capacityPlanningAnalyticsSpaceUtilization, capacityPlanningAnalyticsCustomerWise, capacityPlanningWeekwisePath,
    capacityPlanningAnalyticsPlanVsActualSummary, 
    capacityPlanningAnalyticsPlanVsActual,
    capacityPlanningAllCustomerAllocationPath} = require('../../utils/urlConstant');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const path = './uploads/allocations/excel'
        fs.mkdirSync(path, { recursive: true });
        cb(null, path)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })

const router = express.Router({ mergeParams: true });

const capacityPlanningController = require('./capacity-planning.controller');

router.route(capacityPlanningAllocationPath).post(capacityPlanningController.createAllocation);
router.route(capacityPlanningAllocationPath).get(capacityPlanningController.getAllAllocations);
router.route(capacityPlanningCustomerAllocationPath).put(capacityPlanningController.updateAllocationPerCustomer);
router.route(capacityPlanningCustomerAllocationPath).get(capacityPlanningController.getAllAllocationPerCustomerByAllocationId);
router.route(capacityPlanningAllCustomerAllocationPath).get(capacityPlanningController.getAllCustomerAllocations);
router.route(capacityPlanningWeekwisePath).get(capacityPlanningController.getWeekwiseAllocationByAllocationId);
router.route(capacityPlanningWeekwisePath).put(capacityPlanningController.updateWeekwiseAllocationByAllocationId);
router.route(capacityPlanningAllocationReportExcelDownloadPath).get(capacityPlanningController.getAllocationReportExcel);
router.route(capacityPlanningAllocationReportExcelImportPath).post(upload.single('file'), capacityPlanningController.importAllocationsViaExcel);
router.route(capacityPlanningAnalyticsSpaceUtilization).post(capacityPlanningController.getSpaceUtilization);
router.route(capacityPlanningAnalyticsCustomerWise).post(capacityPlanningController.getCustomerWiseAllocation);
router.route(capacityPlanningAnalyticsPlanVsActualSummary).get(capacityPlanningController.getPlanVsActualSummary);
router.route(capacityPlanningAnalyticsPlanVsActual).get(capacityPlanningController.getPlanVsActual);

module.exports = router;