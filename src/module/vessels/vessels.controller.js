const service = require('./vessels.service');
const logger = require('../../logger/logger');

const createVessel = (req, res) => {
    logger.info(`Creating vessel`);
    service.createVessel(req, res);
}

const getVesselList = (req, res) => {
    logger.info("Get Vessel list");
    service.getVesselList(req, res);
}

const getVesselById = (req, res) => {
    logger.info("Get Vessel By Id");
    service.getVesselById(req, res);
}

const updateVesselById = (req, res) => {
    logger.info("Update Vessel");
    service.updateVesselById(req, res);
}

const deleteVessel = (req, res) => {
    logger.info("Delete Vessel");
    service.deleteVessel(req, res);
}

module.exports = {
    createVessel,
    getVesselList,
    getVesselById,
    updateVesselById,
    deleteVessel
}
