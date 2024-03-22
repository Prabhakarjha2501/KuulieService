const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { getMulterS3Storage } = require('../../utils/aws');
const controller = require('./vessels.controller');

const upload = multer({
    storage: getMulterS3Storage()
});

router.route("/").post(upload.single('image'), controller.createVessel);
router.route("/").get(controller.getVesselList);
router.route("/:id").get(controller.getVesselById);
router.route("/:id").put(upload.single('image'), controller.updateVesselById);
router.route("/:id").delete(controller.deleteVessel);

module.exports = router;
