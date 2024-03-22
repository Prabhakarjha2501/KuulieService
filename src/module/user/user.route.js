const express = require('express');
const router = express.Router({ mergeParams: true });

const userController = require('./user.controller');
const { sendMail, contactUs, sendLink, 
    createUpdateUserFromAdmin,
    createUser, 
    updateUser,
    updateMyProfile,
    getUserById,
    getAllUser, 
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
    getRolesWithPermissionById,
    getAllUsersByCreatedById    } = require('../../utils/urlConstant');

router.route(sendMail).post(userController.sendMail);
router.route(contactUs).post(userController.contactUs);
router.route(sendLink).post(userController.sendLink);
router.route(createUpdateUserFromAdmin).post(userController.createUserFromAdmin);
router.route(`${createUpdateUserFromAdmin}/:authUserId`).put(userController.updateUserFromAdmin);
router.route(createUser).post(userController.createUser);
router.route(updateUser).post(userController.updateUser);
router.route(updateMyProfile).post(userController.updateMyProfile);
router.route(getUserById).get(userController.getUserById);
router.route(getAllUser).get(userController.getAllUser);
router.route(getUsersByClientIdAndAuthUserIds).get(userController.getUsersByClientIdAndAuthUserIds);
router.route(createRole).post(userController.createRole);
router.route(updateRole).post(userController.updateRole);
router.route(getAllRoles).get(userController.getAllRoles);
router.route(createPermission).post(userController.createPermission);
router.route(updatePermission).post(userController.updatePermission);
router.route(getAllPermissions).get(userController.getAllPermissions);
router.route(addUserRoles).post(userController.addUserRoles);
router.route(updateUserRoles).post(userController.updateUserRoles);
router.route(getUserRolesById).get(userController.getUserRolesById);
router.route(addRolesWithPermission).post(userController.addRolesWithPermission);
router.route(updateRolesWithPermission).post(userController.updateRolesWithPermission);
router.route(getRolesWithPermissionById).get(userController.getRolesWithPermissionById);
router.route(getAllUsersByCreatedById).get(userController.getAllUsersByCreatedById);

module.exports = router;