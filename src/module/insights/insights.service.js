require('dotenv').config();
const executeQuery = require('../../db/connect');
const logger = require('../../logger/logger');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const { getUniqueOnlineUsers } = require('../../utils/redis-service');

module.exports.getOnlineUsers = async (req, res) => {

    const pageSize = req.query.pageSize || 10;
    const pageNumber = req.query.pageNumber || 1;
    try {
        const uniqueOnlineUserIds = await getUniqueOnlineUsers();
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + parseInt(pageSize);
        const userId = uniqueOnlineUserIds.slice(startIndex, endIndex).join("','");
        const query = `
                      SELECT firstname, lastname FROM customer_details WHERE auth_user_id IN ('${userId}')
                       UNION
                      SELECT first_name AS firstname, last_name AS lastname FROM user_details WHERE auth_user_id IN ('${userId}')
                         `;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.map((row) => ({
            firstname: row.firstname,
            lastname: row.lastname
        })) || [];
        res.status(OK).send({ data });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || "Error while getting uniqueOnlineUserIds." });
    }
}


module.exports.getUserSession = async (req, res) => {
    const { timeDuration } = req.query;
    let query;
    try {
        if (timeDuration?.toUpperCase() === 'TODAY') {
            query = `WITH RankedEvents AS (
                SELECT
                   ou."userID",
                    action,
                    "time",
                    ROW_NUMBER() OVER (PARTITION BY ou."userID" ORDER BY "time") AS event_rank
                FROM
                            public.online_user_session ou
                WHERE
                    action IN ('CONNECTED', 'DISCONNECTED')
                     AND DATE("time") = CURRENT_DATE 
            ),
            PairedEvents AS (
                SELECT
                    connected."userID" AS userID,
                    connected."time" AS connected_time,
                    disconnected."time" AS disconnected_time
                FROM
                    RankedEvents connected
                LEFT JOIN
                    RankedEvents disconnected ON connected."userID" = disconnected."userID"
                                               AND connected.event_rank = disconnected.event_rank - 1
                WHERE
                    connected.action = 'CONNECTED'
                    AND disconnected.action = 'DISCONNECTED'
            )
            SELECT
                pe.userID,
                CONCAT(cd."firstname", ' ', ud."first_name") AS firstnames,
                CONCAT(cd."lastname", ' ', ud."last_name") AS lastnames,
                SUM(EXTRACT(EPOCH FROM pe.disconnected_time) - EXTRACT(EPOCH FROM pe.connected_time)) AS total_duration_seconds
            FROM
                PairedEvents pe
            LEFT JOIN
                "customer_details" cd ON pe.userID = cd."auth_user_id"
            LEFT JOIN
                "user_details" ud ON pe.userID = ud."auth_user_id"
            GROUP BY
                pe.userID,
                firstnames,
                lastnames
            ORDER BY
                total_duration_seconds DESC
            LIMIT 5`;
        }
        else if (timeDuration?.toUpperCase() === 'WEEKLY') {
            query = `WITH RankedEvents AS (
                SELECT
                   ou."userID",
                    action,
                    "time",
                    ROW_NUMBER() OVER (PARTITION BY ou."userID" ORDER BY "time") AS event_rank
                FROM
                            public.online_user_session ou
                WHERE
                    action IN ('CONNECTED', 'DISCONNECTED')
                       AND "time" >= CURRENT_DATE - INTERVAL '6 days'
                    AND "time" < CURRENT_DATE + INTERVAL '1 day' 
            ),
            PairedEvents AS (
                SELECT
                    connected."userID" AS userID,
                    connected."time" AS connected_time,
                    disconnected."time" AS disconnected_time
                FROM
                    RankedEvents connected
                LEFT JOIN
                    RankedEvents disconnected ON connected."userID" = disconnected."userID"
                                               AND connected.event_rank = disconnected.event_rank - 1
                WHERE
                    connected.action = 'CONNECTED'
                    AND disconnected.action = 'DISCONNECTED'
            )
            SELECT
                pe.userID,
                CONCAT(cd."firstname", ' ', ud."first_name") AS firstnames,
                CONCAT(cd."lastname", ' ', ud."last_name") AS lastnames,
                SUM(EXTRACT(EPOCH FROM pe.disconnected_time) - EXTRACT(EPOCH FROM pe.connected_time)) AS total_duration_seconds
            FROM
                PairedEvents pe
            LEFT JOIN
                "customer_details" cd ON pe.userID = cd."auth_user_id"
            LEFT JOIN
                "user_details" ud ON pe.userID = ud."auth_user_id"
            GROUP BY
                pe.userID,
                firstnames,
                lastnames
            ORDER BY
                total_duration_seconds DESC
            LIMIT 5`
        }
        else if (timeDuration?.toUpperCase() === "MONTHLY") {
            query = `WITH RankedEvents AS (
                SELECT
                   ou."userID",
                    action,
                    "time",
                    ROW_NUMBER() OVER (PARTITION BY ou."userID" ORDER BY "time") AS event_rank
                FROM
                            public.online_user_session ou
                WHERE
                    action IN ('CONNECTED', 'DISCONNECTED')
                 AND EXTRACT(MONTH FROM ou."time") = EXTRACT(MONTH FROM CURRENT_DATE)
            ),
            PairedEvents AS (
                SELECT
                    connected."userID" AS userID,
                    connected."time" AS connected_time,
                    disconnected."time" AS disconnected_time
                FROM
                    RankedEvents connected
                LEFT JOIN
                    RankedEvents disconnected ON connected."userID" = disconnected."userID"
                                               AND connected.event_rank = disconnected.event_rank - 1
                WHERE
                    connected.action = 'CONNECTED'
                    AND disconnected.action = 'DISCONNECTED'
            )
            SELECT
                pe.userID,
                CONCAT(cd."firstname", ' ', ud."first_name") AS firstnames,
                CONCAT(cd."lastname", ' ', ud."last_name") AS lastnames,
                SUM(EXTRACT(EPOCH FROM pe.disconnected_time) - EXTRACT(EPOCH FROM pe.connected_time)) AS total_duration_seconds
            FROM
                PairedEvents pe
            LEFT JOIN
                "customer_details" cd ON pe.userID = cd."auth_user_id"
            LEFT JOIN
                "user_details" ud ON pe.userID = ud."auth_user_id"
            GROUP BY
                pe.userID,
                firstnames,
                lastnames
            ORDER BY
                total_duration_seconds DESC
            LIMIT 5`
        }
        const response = await executeQuery(query, req.dbConnectionString);
        if (response.rows.length > 0) {
            const data = response.rows.map(row => {
                const { userid, total_duration_seconds, firstnames, lastnames } = row;
                const hour = Math.floor(total_duration_seconds / 3600);
                const minute = Math.floor((total_duration_seconds % 3600) / 60);
                return { userid: userid, hour, minute, firstnames, lastnames };
            });
            res.status(OK).send({ data });
        }
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || "Error while getting uniqueOnlineUserIds." });
    }
}