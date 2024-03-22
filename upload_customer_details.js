require('dotenv').config();
const sql = require('sql');
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)
const fs = require('fs');
const readLine = require('readline');
const csvParser = require('csv-parser');
const path = require('path');

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

let User = sql.define({
    name: 'customer_details',
    columns: [
        "firstname",
        "lastname",
        "title",
        "department",
        "company_name",
        "revenue",
        "phone_number",
        "mobile_number",
        "fax_number",
        "primary_emailid",
        "secondary_emailid",
        "website",
        "industry",
        "address_1",
        "address_2",
        "pincode",
        "city",
        "country",
        "lead_owner_id",
        "lead_owner_first_name",
        "lead_owner_last_name",
        "lead_owner_email",
        "lead_owner_mobile",
        "lead_location",
        "lead_source",
        "deal_amount",
        "stage",
        "activity",
        "probability",
        "closing_date",
        "business_type",
    ]
});
let usersToInsert = [];
function getData() {
    let filePath = "/resources/CRM_data.csv";
    new Promise((resolve, rej) => {
        readFromN2M(path.resolve(__dirname) + filePath).then((data) => {
            resolve(data);
        })
    }).then((data) => {
        executeQuery();
    });
}

getData();
async function readFromN2M(fileName) {
    const lineReader = readLine.createInterface({
        input: fs.createReadStream(fileName)
    })
    return new Promise((res, rej) => {
        usersToInsert = [];
        fs.createReadStream(fileName)
            .pipe(csvParser([
                "firstname",
                "lastname",
                "title",
                "department",
                "company_name",
                "revenue",
                "phone_number",
                "mobile_number",
                "fax_number",
                "primary_emailid",
                "secondary_emailid",
                "website",
                "industry",
                "address_1",
                "address_2",
                "pincode",
                "city",
                "country",
                "lead_owner_id",
                "lead_owner_first_name",
                "lead_owner_last_name",
                "lead_owner_email",
                "lead_owner_mobile",
                "lead_location",
                "lead_source",
                "deal_amount",
                "stage",
                "activity",
                "probability",
                "closing_date",
                "business_type"]))
            .on('data', (row) => {
                usersToInsert.push(row);
            }).on('end', () => {
                console.log('done reading');
                usersToInsert = usersToInsert.slice(1);
            });
    }).then((usersToInsert) => {
        return usersToInsert;
    }).catch((err) => {
        return err;
    });
}


const executeQuery = async () => {
    try {
        const client = await pool.connect();
        let query = User.insert(usersToInsert).toQuery();
        let { rows } = await client.query(query);
        console.log(rows);
        client.release()
        return data;
    } catch (err) {
        return err;
    }
}

executeQuery();