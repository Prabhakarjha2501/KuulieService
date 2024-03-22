const service = require('./voyages.service');
const logger = require('../../logger/logger');

const createVoyage = (req, res) => {
    logger.info(`Creating Voyage`);
    service.createVoyage(req, res);
}

const getVoyageList = (req, res) => {
    logger.info("Get Voyage list");
    service.getVoyageList(req, res);
}

const getVoyageById = (req, res) => {
    logger.info("Get Voyage By Id");
    service.getVoyageById(req, res);
}

const getVoyageByVesselIdLoadingAndDestinationPort = (req, res) => {
    logger.info("Get Voyage By VesselId LoadingPort DestinationPort");
    service.getVoyageByVesselIdLoadingAndDestinationPort(req, res);
}

const updateVoyageById = (req, res) => {
    logger.info("Update Voyage");
    service.updateVoyageById(req, res);
}

module.exports = {
    createVoyage,
    getVoyageList,
    getVoyageById,
    getVoyageByVesselIdLoadingAndDestinationPort,
    updateVoyageById
}
