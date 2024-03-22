require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const config = parse(process.env.DATABASE_URL);
const moment = require('moment');

config.ssl = {
  rejectUnauthorized: false
}
const pool = new Pool(config)
const tool=new Pool(config)
const query = `
INSERT INTO "roles" ( "name", "created_by", "created_on", "updated_by", "updated_on", "is_active") VALUES 
('admin', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('user', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true});

INSERT INTO "permissions" ("name", "ref_value", "created_by", "created_on", "updated_by", "updated_on", "is_active") VALUES
('controltower', '8fe02c30-35bf-11ec-89e8-1b453ff50fd7', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('crm', '97e1d1d6-35bf-11ec-98b7-8f02f8c8473c', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('shipment', 'a19a7a52-35bf-11ec-b1de-8bef269d8795', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('quotations', 'aa3077f2-35bf-11ec-a21e-df6757fa9298', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('capacityplanning', 'b7ab5500-35bf-11ec-a803-077fecf0fe11', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('automation', 'c85d209a-35bf-11ec-9d8f-33566d5a0b55', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('contractmanagement', 'd7a9a73a-35bf-11ec-9daa-275183d10404', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('document', 'e06ec10c-35bf-11ec-8e9d-5364d624e985', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('setting', 'e43a53c4-35c3-11ec-8298-fbf788ad4be8', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true}),
('schedules', 'ee4bc2d4-35bf-11ec-989e-c3bc4288e499', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', 'superadmin', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', ${true});
`


pool.connect((err, client, done) => {
  client.query(query, (err, res) => {
    console.log(err, res)
    client.end()
    console.log('Tables inserted Successfully.');
  });
});

module.exports = tool;