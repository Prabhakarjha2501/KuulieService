const logger = require('../../logger/logger');
const allocationService = require('./allocation.service');
require('dotenv').config();

const carrierAllocationNew = (req, res) => {
    logger.info(`Carrier Allocation New API called using data: ${JSON.stringify(req.body)}`)
    allocationService.carrierAllocationNew(req, res).then((response) => res.send(response))
}

const fetchAllCarrierAllocation = (req, res) => {
    logger.info(`Carrier get data`)
    allocationService.fetchAllCarrierAllocation(req, res).then((response) => res.send(response))
}

const fetchWeekAllocation = (req, res) => {
    logger.info(`Carrier get data`)
    allocationService.fetchWeekAllocation(req, res).then((response) => res.send(response))
}

const searchAllocationById = (req, res) => {
    logger.info(`Search Allocation By Id values of Carrier allocation ${JSON.stringify(req.body)}`)
    allocationService.searchAllocationById(req, res).then((response) => res.send(response))
}

const searchAllocationLike = (req, res) => {
    logger.info(`Search Allocation By Id values of Carrier allocation ${JSON.stringify(req.body)}`)
    allocationService.searchAllocationLike(req, res).then((response) => res.send(response))
}

const carrierAllocationNewDefineTargetValues = (req, res) => {
    logger.info(`carrierAllocationNewDefineTargetValues API called using data: ${JSON.stringify(req.body)}`)
    allocationService.carrierAllocationNewDefineTargetValues(req, res).then((response) => res.send(response))
}

const onLoadCarrierAllocation = (req, res) => {
    logger.info(`OnLoad Carrier Allocation Page API called. ${JSON.stringify(req.body)}`)
    allocationService.onLoadCarrierAllocation(req, res).then((response) => res.send(response))
}

const updateCarrierAllocation = (req, res) =>{
    logger.info(`Update values of Carrier allocation ${JSON.stringify(req.body)}`)
    allocationService.updateCarrierAllocation(req, res).then((response) => res.send(response))
}

const updateTargetValues = (req, res) => {
    logger.info(`Update target values of Carrier allocation ${JSON.stringify(req.body)}`)
    allocationService.updateTargetValues(req, res).then((response) => res.send(response))
}

const deleteTargetValues = (req, res) => {
    logger.info(`Delete target values of Carrier allocation ${JSON.stringify(req.body)}`)
    allocationService.deleteTargetValues(req, res).then((response) => res.send(response))
}

const downloadExcel = (req, res) => {
    logger.info(`Download excel aPI call.`);
    allocationService.downloadExcel(res, res).then((response) => response)
}

module.exports = {
    carrierAllocationNew,
    fetchAllCarrierAllocation,
    fetchWeekAllocation,
    carrierAllocationNewDefineTargetValues,
    onLoadCarrierAllocation,
    updateCarrierAllocation,
    updateTargetValues,
    deleteTargetValues,
    downloadExcel,
    searchAllocationById,
    searchAllocationLike,
};