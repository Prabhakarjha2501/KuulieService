require('dotenv').config();
const sql = require('sql');
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)
const excelToJson = require('convert-excel-to-json');

config.ssl = {
    rejectUnauthorized: false
}
const pool = new Pool(config);

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

const demurrage_and_detention = sql.define({
    name: 'demurrage_and_detention',
    columns: [
        "type",
        "carrier",
        "contract_number",
        "contract_owner",
        "validity_date_from",
        "validity_date_to",
        "origin",
        "destination",
        "origin_free_time",
        "destination_free_time_demurrage",
        "destination_free_time_detention",
        "destination_free_time_combined",
        "destination_free_time_charges_demurrage_20",
        "destination_free_time_charges_demurrage_40",
        "destination_free_time_charges_demurrage_hc",
        "destination_free_time_charges_demurrage_45",
        "destination_free_time_charges_demurrage_nor",
        "destination_free_time_charges_detention_20",
        "destination_free_time_charges_detention_40",
        "destination_free_time_charges_detention_hc",
        "destination_free_time_charges_detention_45",
        "destination_free_time_charges_detention_nor",
        "destination_free_time_charges_combined_20",
        "destination_free_time_charges_combined_40",
        "destination_free_time_charges_combined_hc",
        "destination_free_time_charges_combined_45",
        "destination_free_time_charges_combined_nor"
    ]
});

const uploadDemurrageAndDetention = async () => {
    try {
        const result = excelToJson({
            sourceFile: 'uploads/DnD_03-11-2022.xlsx'
        });
        const excelData = result?.Sheet1?.slice(3) || [];

        console.log("excelData.count", excelData.length);

        const client = await pool.connect();
        const chunkSize = 500;
        for (let i = 0; i < excelData.length; i += chunkSize) {
            console.log("Processing chunk - ", i + 1);
            const chunk = excelData.slice(i, i + chunkSize);

            const dnDCodeToInsert = chunk.map((row) => ({
                'type': row.B,
                'carrier': row.C,
                'contract_number': row.D,
                'contract_owner': row.E,
                'validity_date_from': row.F,
                'validity_date_to': row.G,
                'origin': row.H,
                'destination': row.I,
                'origin_free_time': row.J,
                'destination_free_time_demurrage': row.K,
                'destination_free_time_detention': row.L,
                'destination_free_time_combined': row.M,
                'destination_free_time_charges_demurrage_20': row.N,
                'destination_free_time_charges_demurrage_40': row.O,
                'destination_free_time_charges_demurrage_hc': row.P,
                'destination_free_time_charges_demurrage_45': row.Q,
                'destination_free_time_charges_demurrage_nor': row.R,
                'destination_free_time_charges_detention_20': row.S,
                'destination_free_time_charges_detention_40': row.T,
                'destination_free_time_charges_detention_hc': row.U,
                'destination_free_time_charges_detention_45': row.V,
                'destination_free_time_charges_detention_nor': row.W,
                'destination_free_time_charges_combined_20': row.X,
                'destination_free_time_charges_combined_40': row.Y,
                'destination_free_time_charges_combined_hc': row.Z,
                'destination_free_time_charges_combined_45': row.AA,
                'destination_free_time_charges_combined_nor': row.AB
            }));

            const query = demurrage_and_detention.insert(dnDCodeToInsert).toQuery();

            const res = await client.query(query);

            console.log("res", res);
        }
        client.release()
    } catch (err) {
        console.log("error", err);
    }
}

uploadDemurrageAndDetention();
