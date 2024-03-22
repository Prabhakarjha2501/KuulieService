const express = require('express');
const router = express.Router({ mergeParams: true });

const scheduleController = require('./schedule.controller');
const { schedulePortsPath,
    scheduleVesselsPath,
    scheduleCarriersPath,
    scheduleTripssPath,
    scheduleCallsPath,
    scheduleLocationsPath,
    scheduleTrackingPath,
    scheduleSchedulesPath,
    searchSchedulesPath,
    getScheduleRoutePath
} = require('../../utils/urlConstant');

router.route(schedulePortsPath).post(scheduleController.ports);
router.route(scheduleVesselsPath).post(scheduleController.vessels);
router.route(scheduleCarriersPath).post(scheduleController.carriers);
router.route(scheduleTripssPath).post(scheduleController.trips);
router.route(scheduleCallsPath).post(scheduleController.calls);
router.route(scheduleLocationsPath).post(scheduleController.locations);
router.route(scheduleTrackingPath).post(scheduleController.tracking);
router.route(scheduleSchedulesPath).post(scheduleController.schedules);
router.route(searchSchedulesPath).post(scheduleController.searchSchedules);
router.route(getScheduleRoutePath).post(scheduleController.getScheduleRoute);

module.exports = router;