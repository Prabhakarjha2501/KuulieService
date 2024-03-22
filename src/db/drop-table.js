require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)

config.ssl = {
    rejectUnauthorized: false
}
const pool = new Pool(config)

const query = `
    DROP TABLE customer_details;
`

pool.connect((err, client, done) => {
    client.query(query, (err, res) => {
        console.log(err, res)
        client.end()
        console.log('Table Dropped Successfully.');
    });
});

module.exports = pool;