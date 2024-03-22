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

const quatiationRate = sql.define({
    name: 'quotation_rate_output',
    columns: [
        "contract_type",
        "carrier",
        "contract_number",
        "validity_date_from",
        "validity_date_to",
        "origin",
        "destination",
        "tariff_20",
        "tariff_40",
        "tariff_40hc",
    ]
});

const uploadQuotationRate = async () => {
    try {
        const result = excelToJson({
            sourceFile: 'uploads/Ocean Freight from 01 September 2021.xlsx'
        });
        const excelData = result?.Sheet1?.slice(3);
        const quotationRatesToInsert = excelData.map((row) => ({
            'contract_type': row.B, 'carrier': row.C, 'contract_number': row.D,
            'validity_date_from': row.E, 'validity_date_to': row.F, 'origin': row.G, 'destination': row.H,
            'tariff_20': row.I, 'tariff_40': row.J, 'tariff_40hc': row.K
        }));
        const client = await pool.connect();
        const query = quatiationRate.insert(quotationRatesToInsert).toQuery();
        const res = await client.query(query);
        console.log(res)
        client.release()
    } catch (err) {
        console.log(err);
    }
}


uploadQuotationRate();