const express = require('express');
const { bookingHaulagesPath, bookingContainersPath, bookingCarriagePath, bookingPaymentDetails, bookingNotification,
    bookingTemplate, getBookingData, getDataByPort, getIndivisualBookingByPort,getBookingDataById, bookingsInsurance, bookingStatus } = require('../../utils/urlConstant');
const router = express.Router({ mergeParams: true });
const controller = require('./bookings.controller');

router.route("/").post(controller.createBooking);
router.route("/").put(controller.createBooking);
router.route(bookingsInsurance).put(controller.updateBookingInsurance);
router.route(bookingHaulagesPath).post(controller.createHaulage);
router.route(bookingContainersPath).post(controller.createContainers);
router.route(bookingCarriagePath).post(controller.createCarriage);
router.route(bookingPaymentDetails).post(controller.createPayment);
router.route(bookingNotification).post(controller.createNotification);
router.route(bookingTemplate).post(controller.createTemplate);
router.route(getBookingData).get(controller.getBookingInfo);
router.route(getDataByPort).post(controller.getBookingDataByPort);
router.route(getIndivisualBookingByPort).post(controller.getIndivisualBookingByPort);
router.route(getBookingDataById).get(controller.getBookingDataById);
router.route(getBookingDataById).put(controller.saveAndConfirmBooking);
router.route(bookingStatus).get(controller.getBookingsByStatus);

module.exports = router;
