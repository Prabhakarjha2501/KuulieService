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
    name: 'carrier_scac_code',
    columns: [
       "code",
       "name",
       "scac_code",
    ]
});

const uploadScacCode = async () => {
    try {
        const result = excelToJson({
            sourceFile: 'uploads/Scac_Code.xlsx'
        });
        const excelData = result?.Sheet1?.slice(3);
        const scacCodeToInsert = excelData.map((row) => ({
            'code': row.A, 'name': row.B, 'scac_code': row.C
        }));
        const client = await pool.connect();
        const query = scacCode.insert(scacCodeToInsert).toQuery();
        const res = await client.query(query);
        console.log(res)
        client.release()
    } catch (err) {
        console.log(err);
    }
}

uploadScacCode();