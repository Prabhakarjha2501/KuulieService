require('dotenv').config();
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')

const getConnectionPool = (dbConnectionString) => {
    const config = parse(dbConnectionString);
    config.ssl = {
        rejectUnauthorized: false
    }
    return new Pool(config);
}




const executeQuery = async (query, dbConnectionString) => {
    let client;
    try {
        const pool = getConnectionPool(dbConnectionString);
        client = await pool.connect();
        const data = await client.query(query);
        client.release();
        return data;
    } catch (err) {
        if(client && client.release) {
            client.release();
        }
        return err;
    }
}

module.exports = executeQuery;
