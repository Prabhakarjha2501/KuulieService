require('dotenv').config()
const { default: axios } = require('axios')
const fs = require('fs');
const path = require('path');
const moment = require("moment");
const { parse } = require('pg-connection-string')
const qs = require('qs');
const stream = require('stream');
const { promisify } = require('util');
const XLSX = require('xlsx');
const { processExcelDocument } = require('./src/module/dashboard/dashboard.service');
const { getFolders, deleteFile } = require('./src/module/zoho/zoho.service');
const { Pool } = require('pg')
const config = parse(process.env.DATABASE_URL)
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRETE;
let zohoAccessToken = "";
let zohoRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
const allClientDndFolderId = process.env.ZOHO_ALL_CLIENT_DND_FOLDER_ID;

const refreshZohoAccessToken = async (zohoRefreshToken) => {
    const response = await axios.post(`https://accounts.zoho.com/oauth/v2/token?refresh_token=${zohoRefreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`);
    return response.data.access_token;
}

config.ssl = {
    rejectUnauthorized: false
}

const pool = new Pool(config)

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

const finished = promisify(stream.finished);

async function downloadFile(zohoAccessToken, resourceId, outputLocationPath) { // Used
    const writer = fs.createWriteStream(outputLocationPath);
    const response = await axios.get(`https://apidocs.zoho.com/files/v1/content/${resourceId}`, {
        headers: {
            "authorization": `Zoho-oauthtoken ${zohoAccessToken}`
        },
        responseType: 'stream'
    });
    response.data.pipe(writer);
    await finished(writer);
}

const getAndProcessDndForAll = async () => {
    console.log("-----------------------START------------------------------");

    const adminPortalAccessToken = await getAdminPortalAccessToken();

    const clientList = await getClientList(adminPortalAccessToken);
    const clientsMap = clientList.reduce((acc, client) => {
        acc[client.clientName] = { ...client, logo: null };
        return acc;
    }, {});

    zohoAccessToken = await refreshZohoAccessToken(zohoRefreshToken);
    const clientFoldersResponse = await getFolders(zohoAccessToken, allClientDndFolderId);
    const clientFolders = clientFoldersResponse?.data?.FOLDER;
    for (let clientIndex = 0; clientIndex < clientFolders.length; clientIndex++) {
        console.log(clientIndex, "clientIndex")
        const clientFolder = clientFolders[clientIndex];
        const clientData = clientsMap[clientFolder.FOLDERNAME];
        if (!clientData) {
            console.log("--------------------");
            console.log("No client found with name - ", clientFolder.FOLDERNAME);
            continue;
        }
        const carrierFoldersResponse = await getFolders(zohoAccessToken, clientFolder.FOLDERID);
        const carrierFolders = carrierFoldersResponse?.data?.FOLDER;
        for (let carrierIndex = 0; carrierIndex < carrierFolders.length; carrierIndex++) {
            console.log(carrierIndex, 'carrierIndex')
            const carrierFolder = carrierFolders[carrierIndex];
            console.log("carrierFolder.FOLDERID--->>", carrierFolder.FOLDERID);
            const carrierInnerFoldersResponse = await getFolders(zohoAccessToken, carrierFolder.FOLDERID);
            const carrierInnerFolders = carrierInnerFoldersResponse?.data?.FOLDER;
            for (let carrierInnerIndex = 0; carrierInnerIndex < carrierInnerFolders.length; carrierInnerIndex++) {
                console.log('carrierInnerIndex', carrierInnerIndex)
                const carrierInnerFolder = carrierInnerFolders[carrierInnerIndex];
                console.log("carrierInnerFolder.FOLDERID----==-=-=>>", carrierInnerFolder.FOLDERID)
                const carrierFilesResponse = await getFolders(zohoAccessToken, carrierInnerFolder.FOLDERID);
                console.log("carrierFilesResponse", carrierFilesResponse.data);
                const carrierFiles = carrierFilesResponse?.data?.FILES || [];

                for (let carrierFileIndex = 0; carrierFileIndex < carrierFiles.length; carrierFileIndex++) {
                    console.log('carrierFileIndex', carrierFileIndex)
                    const rateFile = carrierFiles[carrierFileIndex];
                    console.log('carrierIndex === 0 && carrierInnerIndex === 0', carrierIndex === 0 && carrierInnerIndex === 0);
                    console.log("carrierIndex--->", carrierIndex, "carrierInnerIndex-->", carrierInnerIndex);
                    if (carrierIndex === 0 && carrierInnerIndex === 0) {

                        const config = parse(clientData.dbConnectionString);
                        config.ssl = {
                            rejectUnauthorized: false
                        }

                        const connectionPool = new Pool(config);
                        databaseInstance = await connectionPool.connect();
                        const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${rateFile.DOCID}'`;
                        console.log("selectQuery", selectQuery)
                        const selectQueryResponse = await databaseInstance.query(selectQuery);
                        console.log(selectQueryResponse, "--- selectQueryResponse ---");
                        if (selectQueryResponse && selectQueryResponse.rowCount === 1) {
                            console.log("File already processed...");
                            continue;
                        }
                        console.log("rateFile", rateFile);
                        let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${rateFile.DOCID}', '${rateFile.DOCNAME}', 'INPROGRESS','${currentDateTimestamp}','ZOHO_FILE_SYNC_SCHEDULER') RETURNING id;`
                        const insertQueryResponse = await databaseInstance.query(insertQuery);
                        if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                            console.log("Error ocurred while inserting tracking record...");
                            continue;
                        }
                        console.log("insertQuery", insertQuery)
                        const zohoRateFileSyncStatusId = insertQueryResponse?.rows[0].id

                        const filePath = path.join(__dirname, rateFile.DOCNAME);
                        await downloadFile(zohoAccessToken, rateFile.DOCID, filePath);

                        const detail = await processExcelDocument(filePath, clientData.dbConnectionString, "Dnd Charges", 'ZOHO_SYNC_LOG_' + rateFile.DOCNAME + '.txt')

                        currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'ZOHO_FILE_SYNC_SCHEDULER'
                        WHERE id = '${zohoRateFileSyncStatusId}';`;

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
        }
        console.log('DONE - clientIndex', clientIndex)
    }

    console.log('COMPLETED');

}

getAndProcessDndForAll().then(res => console.log(res)).catch(() => console.log('ERROR'));