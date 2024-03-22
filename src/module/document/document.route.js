const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { getMulterS3Storage } = require('../../utils/aws');
const documentController = require("./document.controller");
const { getRecordId, deleteDocument } = require('../../utils/urlConstant');

const upload = multer({
    storage: getMulterS3Storage()
});

router.route("/")
    .post(upload.single('file'), documentController.uploadDocument)
    .get(documentController.getDocumentList);

router.route(getRecordId).get(documentController.getModuleIds);
router.route(deleteDocument).delete(documentController.deleteDocumentById);

module.exports = router;