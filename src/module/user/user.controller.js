const userService = require('./user.service');
const logger = require('../../logger/logger');
require('dotenv').config();

const sendMail = (req, res) => {
    logger.info(`Sending email to ${JSON.stringify(req.body)}`)
    userService.sendMail(req, res).then((response) => res.send(response));
}

const sendLink = (req, res) => {
    logger.info(`Sending downloadind link via Mail`)
    userService.sendLink(req, res).then((response) => res.send(response));
}

const contactUs = (req, res) => {
    logger.info(`Contact to customer with data ${JSON.stringify(req.body)}`);
    userService.contactUs(req, res).then((response) => res.send(response));
}

const createUserFromAdmin = (req, res) => {
    logger.info(`Create User From Admin`);
    userService.createUserFromAdmin(req, res).then((response) => res.send(response));
}

const updateUserFromAdmin = (req, res) => {
    logger.info(`Update User From Admin`);
    userService.updateUserFromAdmin(req, res).then((response) => res.send(response));
}

const createUser = (req, res) => {
    logger.info(`Create User`);
    userService.createUser(req, res).then((response) => res.send(response));
}

const updateUser = (req, res) => {
    logger.info(`Update User`);
    userService.updateUser(req, res).then((response) => res.send(response));
}

const updateMyProfile = (req, res) => {
    logger.info(`Update My Profile`);
    userService.updateMyProfile(req, res).then((response) => res.send(response));
}

const getUserById = (req, res) => {
    logger.info(`Get User By Id`);
    userService.getUserById(req, res).then((response) => res.send(response));
}

const getAllUser = (req, res) => {
    logger.info(`Get User List`);
    userService.getAllUser(req, res).then((response) => res.send(response));
}

const getAllUsersByCreatedById = (req, res) => {
    logger.info(`Get User List`);
    userService.getAllUsersByCreatedById(req, res).then((response) => res.send(response));
}

const getUsersByClientIdAndAuthUserIds = (req, res) => {
    logger.info(`Get Users By ClientId and AuthUserIds`);
    userService.getUsersByClientIdAndAuthUserIds(req, res).then((response) => res.send(response));
}

const createRole = (req, res) => {
    logger.info(`Create Role`);
    userService.createRole(req, res).then((response) => res.send(response));
}

const updateRole = (req, res) => {
    logger.info(`Update Role`);
    userService.updateRole(req, res).then((response) => res.send(response));
}

const getAllRoles = (req, res) => {
    logger.info(`Get All Roles`);
    userService.getAllRoles(req, res).then((response) => res.send(response));
}

const createPermission = (req, res) => {
    logger.info(`Create Permission`);
    userService.createPermission(req, res).then((response) => res.send(response));
}

const updatePermission = (req, res) => {
    logger.info(`Update Permission`);
    userService.updatePermission(req, res).then((response) => res.send(response));
}

const getAllPermissions = (req, res) => {
    logger.info(`Get All Permissions`);
    userService.getAllPermissions(req, res).then((response) => res.send(response));
}

const addUserRoles = (req, res) => {
    logger.info(`Add User Permissions`);
    userService.addUserRoles(req, res).then((response) => res.send(response));
}

const updateUserRoles = (req, res) => {
    logger.info(`Update User Permissions`);
    userService.updateUserRoles(req, res).then((response) => res.send(response));
}

const getUserRolesById = (req, res) => {
    logger.info(`Get User Permissions By Id`);
    userService.getUserRolesById(req, res).then((response) => res.send(response));
}

const addRolesWithPermission = (req, res) => {
    logger.info(`Add Role Permissions`);
    userService.addRolesWithPermission(req, res).then((response) => res.send(response));
}

const updateRolesWithPermission = (req, res) => {
    logger.info(`Update Role Permissions`);
    userService.updateRolesWithPermission(req, res).then((response) => res.send(response));
}

const getRolesWithPermissionById = (req, res) => {
    logger.info(`Get Roles Permissions By Id`);
    userService.getRolesWithPermissionById(req, res).then((response) => res.send(response));
}

module.exports = {
    sendMail,
    contactUs,
    sendLink,
    createUserFromAdmin,
    updateUserFromAdmin,
    createUser,
    updateUser,
    updateMyProfile,
    getUserById,
    getAllUser,
    getAllUsersByCreatedById,
    getUsersByClientIdAndAuthUserIds,
    createRole,
    updateRole,
    getAllRoles,
    createPermission,
    updatePermission,
    getAllPermissions,
    addUserRoles,
    updateUserRoles,
    getUserRolesById,
    addRolesWithPermission,
    updateRolesWithPermission,
    getRolesWithPermissionById    
};