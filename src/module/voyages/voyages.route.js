const express = require('express');
const { getVoyageByVesselIdLoadingAndDestinationPortPath } = require('../../utils/urlConstant');
const router = express.Router({ mergeParams: true });
const controller = require('./voyages.controller');

router.route("/").post(controller.createVoyage);
router.route("/").get(controller.getVoyageList);
router.route(getVoyageByVesselIdLoadingAndDestinationPortPath).get(controller.getVoyageByVesselIdLoadingAndDestinationPort);
router.route("/:id").get(controller.getVoyageById);
router.route("/:id").put(controller.updateVoyageById);

module.exports = router;
