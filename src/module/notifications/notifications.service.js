require('dotenv').config();
const moment = require('moment')
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const { getLoggedInUserInfo } = require('../../utils/services/shared.service');

module.exports.getNotificationList = async (dbConnectionString) => {
    try {
        const query = "SELECT * FROM notifications WHERE deleted = false ORDER BY 1 DESC;";
        const queryResponse = await executeQuery(query, dbConnectionString);
        const data = queryResponse?.rows?.map(row => ({
            id: row.id,
            type: row.type,
            audience: row.audience,
            message: row.message,
            details: row.details,
            createdOn: row.created_on,
            createdBy: row.createdBy
        }));
        return data || [];
    } catch (error) {
        console.log("Get notification list", error);
        return [];
    }
}

const addNotification = async (dbConnectionString, loggedInUserId, type, audience, message, details) => {
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const query = `INSERT INTO notifications(type, audience, message, details, created_on, created_by)
                        VALUES('${type}', '${audience}', '${message}', '${details}', '${currentDateTimestamp}', '${loggedInUserId}') RETURNING id`;
        const queryResponse = await executeQuery(query, dbConnectionString);
        if (queryResponse?.rows?.length === 1 && queryResponse?.rows[0].id) {
            return true;
        }
        return false;
    } catch (error) {
        console.log("Error during Add notification", error);
        return false;
    }
}

module.exports.addNotificationAndEmit = async (io, dbConnectionString, loggedInUserId, authUserId, type, audience, message, details) => {
    try {
        const isNotificationAdded = await addNotification(dbConnectionString, loggedInUserId, type, audience, message, details);
        if (isNotificationAdded) {
            io.emit("new_notification", { type, audience, message, details, sender: { id: loggedInUserId, authUserId } });
        }
    } catch (error) {
        console.log("Error in addNotificationAndEmit - ", error);
    }
}

const getActiveCustomerNotificationsCount = async (dbConnectionString, userId) => {
    try {
        const query = `SELECT COUNT(*) as count FROM notifications WHERE deleted = false AND audience = 'CUSTOMER-${userId}';`;
        const queryResponse = await executeQuery(query, dbConnectionString);
        if (queryResponse?.rows?.length === 1 && queryResponse?.rows[0].count) {
            return queryResponse?.rows[0].count;
        }
        return 0;
    } catch (error) {
        console.log("Get notification list", error);
        return 0;
    }
}

module.exports.getCustomerNotifications = async (req, res) => {
    const pageSize = req.query.pageSize || 5;
    const pageNumber = req.query.pageNumber || 1;
    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;
    const authUserId = req.user.id;
    const totalCount = await getActiveCustomerNotificationsCount(req.dbConnectionString, authUserId);

    const query = `SELECT * FROM notifications WHERE deleted = false AND audience = 'CUSTOMER-${authUserId}' ORDER BY 1 DESC LIMIT ${limit} OFFSET ${offset};`;
    try {
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.map((row) => ({
            id: row.id,
            type: row.type,
            audience: row.audience,
            message: row.message,
            details: row.details,
            deleted: row.deleted,
            createdOn: row.created_on,
            createdBy: row.created_by,
            updatedOn: row.updated_on,
            updatedBy: row.updated_by
        })) || [];
        res.status(OK).send({ data, totalCount: Number(totalCount) });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getActiveNotificationsCount = async (dbConnectionString, authUserId) => {
    try {
        const query = `SELECT COUNT(*) as count FROM notifications WHERE deleted = false AND audience IN ('ALL', '${authUserId}', 'CUSTOMER-${authUserId}');`;
        const queryResponse = await executeQuery(query, dbConnectionString);
        if (queryResponse?.rows?.length === 1 && queryResponse?.rows[0].count) {
            return queryResponse?.rows[0].count;
        }
        return 0;
    } catch (error) {
        console.log("Get notification list", error);
        return 0;
    }
}

module.exports.getNotifications = async (req, res) => {

    const pageSize = req.query.pageSize || 5;
    const pageNumber = req.query.pageNumber || 1;
    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;
    const totalCount = await getActiveNotificationsCount(req.dbConnectionString, req.user.id);

    const query = `SELECT * FROM notifications WHERE deleted = false AND audience IN ('ALL', '${req.user.id}', 'CUSTOMER-${req.user.id}') ORDER BY 1 DESC LIMIT ${limit} OFFSET ${offset};`;
    try {
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.map((row) => ({
            id: row.id,
            type: row.type,
            audience: row.audience,
            message: row.message,
            details: row.details,
            deleted: row.deleted,
            createdOn: row.created_on,
            createdBy: row.created_by,
            updatedOn: row.updated_on,
            updatedBy: row.updated_by
        })) || [];
        res.status(OK).send({ data, totalCount: Number(totalCount) });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.updateNotification = async (req, res) => {
    const { id, deleted } = req.body
    const query = `UPDATE  notifications SET "deleted"='${deleted}' WHERE "id"='${id}'`
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            if (data.rowCount === 0) {
                res.status(OK).send({ rowCount: data.rowCount, message: 'Not data updated.' })
            } else {
                res.status(OK).send({ rowCount: data.rowCount, message: 'Notification successfully updated.' })
            }
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

