require('dotenv').config();
const sql = require('sql');
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)
const excelToJson = require('convert-excel-to-json');

config.ssl = {
    rejectUnauthorized: false
}
const pool = new Pool(config)

pool.connect((err, client, done) => {
    client.query('SELECT NOW()', (err, res) => {
        done()
        if (err) {
            console.error(err);
            return;
        }
        console.log('Connection successful.');
    });
});

const scacCode = sql.define({
    name: 'commodity_hs_code',
    columns: [
       "hs_code",
       "product_description",
    ]
});

const uploadCommodityCode = async () => {
    try {
        const result = excelToJson({
            sourceFile: 'uploads/Commodity_hs_codes.xlsx'
        });
        const excelData = result?.Sheet1?.slice(3);
        const commodityCodeToInsert = excelData.map((row) => ({
            'hs_code': row.A, 'product_description': row.B
        }));
        const client = await pool.connect();
        const query = scacCode.insert(commodityCodeToInsert).toQuery();
        const res = await client.query(query);
        console.log(res)
        client.release()
    } catch (err) {
        console.log(err);
    }
}

uploadCommodityCode();