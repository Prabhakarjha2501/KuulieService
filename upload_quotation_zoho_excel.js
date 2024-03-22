require('dotenv').config()
const { default: axios } = require('axios')
const fs = require('fs');
const path = require('path');
const moment = require("moment");
const { parse } = require('pg-connection-string')
const qs = require('qs');
const { processExcelDocument } = require('./src/module/dashboard/dashboard.service');
const { deleteFile } = require('./src/module/zoho/zoho.service');
const { Pool } = require('pg')
const office365 = require('./src/module/zoho/office365.service');

const config = parse(process.env.DATABASE_URL)

config.ssl = {
    rejectUnauthorized: false
}

const getAdminPortalAccessToken = async () => { // Used
    const data = qs.stringify({
        'grant_type': 'password',
        'username': process.env.SUPERADMIN_USERNAME,
        'password': process.env.SUPERADMIN_PASSWORD
    });
    const config = {
        method: 'post',
        url: `${process.env.AUTH_API_URL}/auth/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };
    const response = await axios(config);
    return response.data.access_token;
}

const getClientList = async (token) => { // Used
    const response = await axios.get(`${process.env.AUTH_API_URL}/api/clients?pageNumber=0&pageSize=9999999999`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data.data;
}

const getAndProcessQuotationRatesForAll = async () => {
    try {
        console.log("----- START -----");
        const adminPortalAccessToken = await getAdminPortalAccessToken();
        const clientList = await getClientList(adminPortalAccessToken);
        const clientsMap = clientList.reduce((acc, client) => {
            acc[client.clientName] = { ...client, logo: null };
            return acc;
        }, {});
        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, process.env.OFFICE365_CLIENT_RATES_FOLDER_ID), authResponse.accessToken);
        // const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, '01OVF733TBZ6XNGE7RLBFZPOPWLEZMFU26'), authResponse.accessToken); // To get new folder IDs
        const clients = clientsResponse?.value || [];
        for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
            const client = clients[clientIndex];
            const clientData = clientsMap[client.name];
            if (!clientData) {
                console.log("No client found with name - ", client.name);
                continue;
            }
            const carriersResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, client.id), authResponse.accessToken);
            const carriers = carriersResponse?.value || [];
            for (let carrierIndex = 0; carrierIndex < carriers.length; carrierIndex++) {
                const carrier = carriers[carrierIndex];
                const filesResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, carrier.id), authResponse.accessToken);
                const files = filesResponse?.value || [];

                for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                    const file = files[fileIndex];
                    const fileName = file.name;
                    const config = parse(clientData.dbConnectionString);
                    config.ssl = {
                        rejectUnauthorized: false
                    }
                    const connectionPool = new Pool(config);
                    databaseInstance = await connectionPool.connect();
                    const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${file.id}'`;
                    const selectQueryResponse = await databaseInstance.query(selectQuery);
                    if (selectQueryResponse && selectQueryResponse.rowCount === 1) {
                        console.log("File already processed...");
                        continue;
                    }

                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${file.id}', '${file.name}', 'INPROGRESS','${currentDateTimestamp}','ZOHO_FILE_SYNC_SCHEDULER') RETURNING id;`

                    const insertQueryResponse = await databaseInstance.query(insertQuery);
                    if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                        console.log("Error ocurred while inserting tracking record...");
                        continue;
                    }

                    const fileSyncStatusId = insertQueryResponse?.rows[0].id

                    const filePath = path.join(__dirname, fileName);
                    const fileContentStream = await office365.callApi(office365.apiConfig.fileContentByItemId(driveId, file.id), authResponse.accessToken, {
                        responseType: 'stream'
                    });
                    const writeStream = fs.createWriteStream(filePath);
                    fileContentStream.pipe(writeStream);
                    await new Promise((resolve, reject) => {
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                    });
                    const detail = await processExcelDocument(filePath, clientData.dbConnectionString, "Quotation Rates", 'ZOHO_SYNC_LOG_' + fileName + '.txt')
                    currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'ZOHO_FILE_SYNC_SCHEDULER'
                        WHERE id = '${fileSyncStatusId}';`;
                    const updateQueryResponse = await databaseInstance.query(updateQuery);
                    databaseInstance.release();
                    if (updateQueryResponse && updateQueryResponse?.rowCount > 0) {
                        console.log("----File processed successfully and status updated in DB----");
                    } else {
                        console.log("----File processed successfully and failed to update status in DB----");
                    }
                    await deleteFile(filePath);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
    console.log('COMPLETED');
}

getAndProcessQuotationRatesForAll().then(res => console.log(res)).catch(() => console.log('ERROR'));