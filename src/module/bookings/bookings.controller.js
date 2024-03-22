const service = require('./bookings.service');
const logger = require('../../logger/logger');

const createBooking = (req, res) => {
    logger.info("Creating Booking");
    service.createBooking(req, res);
}

const createHaulage = (req, res) => {
    logger.info("Creating Booking Haulage");
    service.createHaulage(req, res);
}

const createContainers = (req, res) => {
    logger.info("Creating Booking Container");
    service.createContainers(req, res);
}

const createCarriage = (req, res) => {
    logger.info("Creating Booking Carriage");
    service.createCarriage(req, res);
}

const createPayment = (req, res) => {
    logger.info("Creating Booking Payment");
    service.createPayment(req, res);
}

const createNotification = (req, res) => {
    logger.info("Creating Booking Notification");
    service.createNotification(req, res);
}

const createTemplate = (req, res) => {
    logger.info("Creating Booking Template");
    service.createTemplate(req, res);
}

const getBookingInfo = (req, res) => {
    logger.info("Get Booking List");
    service.getBookingInfo(req, res);
}

const getBookingDataByPort = (req, res) => {
    logger.info("Get Data By Ports");
    service.getBookingDataByPort(req, res);
}

const getIndivisualBookingByPort = (req, res) => {
    logger.info("Get Data By Ports");
    service.getIndivisualBookingByPort(req, res);
}

const getBookingDataById = (req, res) => {
    logger.info("Get Data By Ports");
    service.getBookingDataById(req, res);
}

const updateBookingInsurance = (req, res) => {
    logger.info("updateBookingInsurance");
    service.updateBookingInsurance(req, res);
}

const saveAndConfirmBooking = (req, res) => {
    logger.info("saveAndConfirmBooking");
    service.saveAndConfirmBooking(req, res);
}

const getBookingsByStatus = (req, res) => {
    logger.info("getBookingsByStatus");
    service.getBookingsByStatus(req, res);
}

module.exports = {
    createBooking,
    createHaulage,
    createContainers,
    createCarriage,
    createPayment,
    createNotification,
    createTemplate,
    getBookingInfo,
    getBookingDataByPort,
    getIndivisualBookingByPort,
    getBookingDataById,
    updateBookingInsurance,
    saveAndConfirmBooking,
    getBookingsByStatus
}
