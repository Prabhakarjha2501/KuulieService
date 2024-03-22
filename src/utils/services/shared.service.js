require('dotenv').config();
const moment = require('moment')
const executeQuery = require('../../db/connect');
const { UNAUTHORIZED } = require('../../utils/apiStatus');

const getCurrentDateTimestamp = () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

const getFormattedDate = (date) => moment(date).format('YYYY-MM-DD');

const getLoggedInUserInfo = async (req, res) => {
    const authUserId = req.user.id;
    const getUserByAuthUserId =
        req.user.role === "CUSTOMER"
            ? `SELECT * FROM customer_details WHERE "auth_user_id" = '${authUserId}'`
            : `SELECT * FROM "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
    if (!user || !(user.user_id || user.customer_id)) {
        return res.status(UNAUTHORIZED).json({ message: "No details found for logged in user." });
    }
    if (user) {
        return { ...user, user_id: user.user_id || user.customer_id };
    }
    return null;
}

const toRoundedFixed = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const getDateByWeekNumber = (weekNumber, day) => moment().day(day).isoWeek(Number(weekNumber)).format('YYYY-MM-DD');

const getWeekOfYear = date => moment(date).isoWeek();

const getPortCode = port => {
    const portCode = port?.split(", ");
    return portCode[2];
}

module.exports = {
    getCurrentDateTimestamp,
    getLoggedInUserInfo,
    toRoundedFixed,
    getFormattedDate,
    getDateByWeekNumber,
    getWeekOfYear,
    getPortCode
}
