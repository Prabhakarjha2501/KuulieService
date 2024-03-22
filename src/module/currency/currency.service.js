require('dotenv').config();
const executeQuery = require('../../db/connect');
const axios = require("axios");
const moment = require("moment")
const sql = require("sql");
const { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND } = require('../../utils/apiStatus');
const { Pool } = require('pg')
const { parse } = require('pg-connection-string');

// const getConnectionPool = (dbConnectionString) => {
//     const config = parse(dbConnectionString);
//     config.ssl = {
//         rejectUnauthorized: false
//     }
//     return new Pool(config);
// }

const createCurrency = async (req, res) => {
    const authUserId = req.user.id;
    const {
        currency,
        exchange_rate
    } = req.body;
    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
    const query = `INSERT INTO currencies( currency,
        exchange_rate,created_on,created_by)
    VALUES('${currency}','${exchange_rate}','${currentDateTimestamp}','${user.user_id}')`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: "Currency successfully inserted." });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getCurrenciesInfo = async (req, res) => {
    const pageSize = req.query.pageSize || 10;
    const pageNumber = req.query.pageNumber || 1;
    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;
    const query = (`SELECT * FROM currencies ORDER BY currency LIMIT ${limit} OFFSET ${offset}`)
    const countQuery = `SELECT COUNT(*) FROM currencies`;
    const totalCount = await executeQuery(countQuery, req.dbConnectionString);
    try {
        const data = await executeQuery(query, req.dbConnectionString)
        const totalRecords = parseInt(totalCount.rows[0].count);
        res.status(OK).send
            ({
                data: data.rows,
                currentPage: pageNumber,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize),
                totalRecords: totalRecords,
            });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const updateCurrencyData = async (req, res) => {
    const authUserId = req.user.id;
    const { currency, exchange_rate } = req.body;
    const id = req.params.id;
    try {
        const currentDateTimestamp = moment(new Date()).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(
            getUserByAuthUserId,
            req.dbConnectionString
        );
        const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        const query = `UPDATE currencies
                          set 
                          "currency" = '${currency}',
                          "exchange_rate"= ${exchange_rate},
                          "updated_by" = '${user.user_id}',
                          "updated_on" = '${currentDateTimestamp}'
                          where currency_id = ${id}`;
        const localChargesUpdateQueryResponse = await executeQuery(query, req.dbConnectionString);
        return res.send({
            message: "local charges updated successfully",
        });
    } catch (error) {
        return res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: error.message || error });
    }


}

const getChargeById = async (req, res) => {
    const { id } = req.params;
    const query = `select * from currencies where currency_id = '${id}';`;
    try {
        let chargeDetailsList = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send({ itemList: chargeDetailsList.rows });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getAllCurrenciesMap = async (dbConnectionString) => {
    const query = "SELECT currency, exchange_rate FROM currencies;";
    const response = await executeQuery(query, dbConnectionString);
    currenciesMap = response.rows?.reduce((acc, item) => {
        acc[item.currency] = Number(item.exchange_rate);
        return acc;
    }, {});
    return currenciesMap;
};

module.exports = {
    createCurrency,
    getCurrenciesInfo,
    updateCurrencyData,
    getChargeById,
    getAllCurrenciesMap
}
