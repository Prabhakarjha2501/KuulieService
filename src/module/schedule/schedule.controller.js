const scheduleService = require('./schedule.service');
const logger = require('../../logger/logger');
require('dotenv').config();

const ports = (req, res) => {
    logger.info(`Fetch Schedule Ports`);
    scheduleService.ports(req, res).then((response) => res.send(response));
}

const vessels = (req, res) => {
    logger.info(`Fetch Schedule Vessels`);
    scheduleService.vessels(req, res).then((response) => res.send(response));
}

const carriers = (req, res) => {
    logger.info(`Fetch Schedule Carriers`);
    scheduleService.carriers(req, res).then((response) => res.send(response));
}

const trips = (req, res) => {
    logger.info(`Fetch Schedule Trips`);
    scheduleService.trips(req, res).then((response) => res.send(response));
}

const calls = (req, res) => {
    logger.info(`Fetch Schedule Calls`);
    scheduleService.calls(req, res).then((response) => res.send(response));
}

const locations = (req, res) => {
    logger.info(`Fetch Schedule Locations`);
    scheduleService.locations(req, res).then((response) => res.send(response));
}

const tracking = (req, res) => {
    logger.info(`Fetch Schedule Tracking`);
    scheduleService.tracking(req, res).then((response) => res.send(response));
}

const schedules = (req, res) => {
    logger.info(`Fetch Schedule Schedules`);
    scheduleService.schedules(req, res).then((response) => res.send(response));
}

const searchSchedules = (req, res) => {
    logger.info("Search Schedules");
    scheduleService.searchSchedules(req, res);
}

const getScheduleRoute = (req, res) => {
    logger.info("Get Schedule Route");
    scheduleService.getScheduleRoute(req, res);
}

module.exports = {
    ports,
    vessels,
    carriers,
    trips,
    calls,
    locations,
    tracking,
    schedules,
    searchSchedules,
    getScheduleRoute
};