const logger = require('../../logger/logger');
const documentService = require('./document.service');
require('dotenv').config();

module.exports.uploadDocument = (req, res) => {
    logger.info("Upload document");
    documentService.uploadDocument(req, res);
}

module.exports.getDocumentList = (req, res) => {
    logger.info("Get document list");
    documentService.getDocumentList(req, res);
}

module.exports.getModuleIds = (req, res) => {
    logger.info("Get Module Ids");
    documentService.getModuleIds(req, res);
}

module.exports.deleteDocumentById = (req, res) => {
    logger.info("Delete Document");
    documentService.deleteDocumentById(req, res);
}

