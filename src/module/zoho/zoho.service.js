require('dotenv').config()
const { default: axios } = require('axios')
const fs = require('fs');
const path = require('path');
const qs = require('qs');
const stream = require('stream');
const { promisify } = require('util');
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const moment = require('moment');
const XLSX = require('xlsx');
const pfs = require('fs/promises');
const office365 = require('./office365.service');

const { processExcelDocument } = require('../dashboard/dashboard.service');
const { sendMail } = require('../../utils/email/email');
const { contractRatesExpires } = require('../../utils/email/templates/contrctRateExpires');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRETE;
const quotationRateExcelResourceId = process.env.ZOHO_QUOTATION_RATE_EXCEL_RESOURCE_ID;
const portsDataExcelResourceId = process.env.ZOHO_PORTS_DATA_EXCEL_RESOURCE_ID;
const allClientRatesFolderId = process.env.ZOHO_ALL_CLIENT_RATES_FOLDER_ID;
const allClientLocalChargesFolderId = process.env.ZOHO_ALL_CLIENT_CHARGES_FOLDER_ID;
const allClientDndFolderId = process.env.ZOHO_ALL_CLIENT_DND_FOLDER_ID;

let zohoAccessToken = "";
let zohoRefreshToken = process.env.ZOHO_REFRESH_TOKEN;

const refreshZohoAccessToken = async (zohoRefreshToken) => {
    const response = await axios.post(`https://accounts.zoho.com/oauth/v2/token?refresh_token=${zohoRefreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`);
    return response.data.access_token;
}

const getAdminPortalAccessToken = async () => {
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

const getClientList = async (token) => {
    const response = await axios.get(`${process.env.AUTH_API_URL}/api/clients?pageNumber=0&pageSize=9999999999`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data.data;
}

const finished = promisify(stream.finished);

async function downloadFile(zohoAccessToken, resourceId, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);
    const response = await axios.post(`https://sheet.zoho.com/api/v2/download/${resourceId}`,
        `method=workbook.download&format=xlsx`, {
        headers: {
            "authorization": `Zoho-oauthtoken ${zohoAccessToken}`,
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        responseType: 'stream'
    });
    response.data.pipe(writer);
    await finished(writer);
}

const getIfNumber = s => isNaN(s) ? 0 : s;

const getPgSQLFormattedDate = (date) => {
    try {
        let momentInstance = moment(date);
        if (!momentInstance?.isValid()) {
            momentInstance = moment(date, 'DD/MM/YYYY');
        }
        return momentInstance.format('YYYY-MM-DD 00:00:00');
    } catch (error) {
        console.log("Error - ", error)
    }
}

const processsQuotationRateDataJson = async (clientList, excelData) => {
    console.log("Number of rows - ", excelData.length);

    let query = excelData.reduce((acc, row, index) => {
        if (index < 2) return acc;
        const contractType = row.B;
        const carrier = row.C;
        const contractNumber = row.D;
        const validityDateFrom = getPgSQLFormattedDate(row.E);
        const validityDateTo = getPgSQLFormattedDate(row.F);
        const origin = row.G;
        const destination = row.H;
        const tariff20 = getIfNumber(row.I);
        const tariff40 = getIfNumber(row.J);
        const tariff40HC = getIfNumber(row.K);

        acc += `
                IF NOT EXISTS (SELECT 1
                        FROM quotation_rate_output
                        WHERE contract_type = '${contractType}'
                        AND carrier = '${carrier}'
                        AND contract_number = '${contractNumber}'
                        AND validity_date_from = '${validityDateFrom}'
                        AND validity_date_to = '${validityDateTo}'
                        AND origin ILIKE '${origin}'
                        AND destination ILIKE '${destination}') THEN
                            INSERT INTO quotation_rate_output
                            ( contract_type
                            , carrier
                            , contract_number
                            , validity_date_from
                            , validity_date_to, origin
                            , destination
                            , tariff_20
                            , tariff_40
                            , tariff_40hc )
                            VALUES
                            ( '${contractType}'
                            , '${carrier}'
                            , '${contractNumber}'
                            , '${validityDateFrom}'
                            , '${validityDateTo}'
                            , '${origin}'
                            , '${destination}'
                            , ${tariff20}
                            , ${tariff40}
                            , ${tariff40HC} );
                        ELSE
                            UPDATE quotation_rate_output
                            SET tariff_20 = ${tariff20}
                                ,tariff_40 = ${tariff40}
                                ,tariff_40hc = ${tariff40HC}
                            WHERE contract_type = '${contractType}'
                                AND carrier = '${carrier}'
                                AND contract_number = '${contractNumber}'
                                AND validity_date_from = '${validityDateFrom}'
                                AND validity_date_to = '${validityDateTo}'
                                AND origin ILIKE '${origin}'
                                AND destination ILIKE '${destination}';
                END IF;
        `;

        return acc;
    }, `DO
        $do$
        BEGIN`);

    query += `
            END
            $do$;`;

    for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const dbConnectionString = client.dbConnectionString;
        if (dbConnectionString) {
            try {
                const config = parse(dbConnectionString);
                config.ssl = {
                    rejectUnauthorized: false
                }
                const connectionPool = new Pool(config);
                databaseInstance = await connectionPool.connect();
                console.log("Connected - ", dbConnectionString);

                const data = await databaseInstance.query(query);
                databaseInstance.release();
                console.log("Query Response - ", data);

            } catch (error) {
                console.log(error);
                console.log("Invalid dbConnectionString - ", dbConnectionString);
                continue;
            }
        }
    }

}

const processsPortsDataJson = async (clientList, excelData) => {
    console.log("Number of rows - ", excelData.length);
    let query = excelData?.reduce((acc, row, index) => {
        if (index < 1) return acc;
        if (!row.B) return acc;
        const name = row.B.trim();
        const latitude = getIfNumber(row.C);
        const longitude = getIfNumber(row.D);

        acc += `
                IF NOT EXISTS (SELECT 1
                        FROM onload_quotation
                        WHERE ports ILIKE '${name}') THEN
                            INSERT INTO onload_quotation
                            ( ports
                            , container_type
                            , incoterms
                            , terms
                            , lat
                            , lng )
                            VALUES
                            ( '${name}'
                            , ''
                            , ''
                            , ''
                            , ${latitude}
                            , ${longitude} );
                        ELSE
                            UPDATE onload_quotation
                            SET lat = ${latitude}
                                ,lng = ${longitude}
                            WHERE ports ILIKE '${name}';
                END IF;
        `;

        return acc;
    }, `DO
        $do$
        BEGIN`);

    query += `
            END
            $do$;`;

    for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const dbConnectionString = client.dbConnectionString;
        if (dbConnectionString && dbConnectionString?.trim()?.toUpperCase() != "NA") {
            try {
                const config = parse(dbConnectionString);
                config.ssl = {
                    rejectUnauthorized: false
                }
                const connectionPool = new Pool(config);
                const dbInstance = await connectionPool.connect();
                console.log("Connected - ", dbConnectionString);

                const data = await dbInstance.query(query);
                dbInstance.release();
                console.log("Query Response - ", data);

            } catch (error) {
                console.log(error);
                console.log("Invalid dbConnectionString - ", dbConnectionString);
                continue;
            }
        }
    }

}

const getDataJsonFromExcel = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { header: "A" });
}

const doGetAndProcessQuotationRateExcel = async () => {
    try {
        zohoAccessToken = await refreshZohoAccessToken(zohoRefreshToken);
        const filePath = path.join(__dirname, "QuotationRateExcel.xlsx");
        await downloadFile(zohoAccessToken, quotationRateExcelResourceId, filePath);

        const quotationRateDataJson = getDataJsonFromExcel(filePath);
        const adminPortalAccessToken = await getAdminPortalAccessToken();
        const clientList = await getClientList(adminPortalAccessToken);
        await processsQuotationRateDataJson(clientList, quotationRateDataJson);
    } catch (error) {
        console.log(error);
    }
}

const doGetAndProcessPortsDataExcel = async () => {
    try {
        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const portsFileId = process.env.OFFICE365_PORTS_FILE_ID;
        const filePath = path.join(__dirname, "PORTS_DATA.xlsx");
        const fileContentStream = await office365.callApi(office365.apiConfig.fileContentByItemId(driveId, portsFileId), authResponse.accessToken, {
            responseType: 'stream'
        });
        const writeStream = fs.createWriteStream(filePath);
        fileContentStream.pipe(writeStream);
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        const json = getDataJsonFromExcel(filePath);
        const adminPortalAccessToken = await getAdminPortalAccessToken();
        const clientList = await getClientList(adminPortalAccessToken);
        await processsPortsDataJson(clientList, json);
    } catch (error) {
        console.log(error);
    }
}

const getAndProcessQuotationRateExcel = async (_req, res) => {
    await doGetAndProcessQuotationRateExcel();
    res.send({ message: "Processing started" });
}

async function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        await pfs.unlink(filePath);
    }
}

async function getFolders(zohoAccessToken, ratesFolderId) {
    const response = await axios.get(`https://apidocs.zoho.com/files/v1/folders?folderid=${ratesFolderId}`, {
        headers: {
            "authorization": `Zoho-oauthtoken ${zohoAccessToken}`
        }
    });
    return response;
}

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

const getAndProcessQuotationRatesForAll = async () => {
    try {
        const adminPortalAccessToken = await getAdminPortalAccessToken();

        const clientList = await getClientList(adminPortalAccessToken);
        const clientsMap = clientList.reduce((acc, client) => {
            acc[client.clientName] = { ...client, logo: null };
            return acc;
        }, {});
        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, process.env.OFFICE365_CLIENT_RATES_FOLDER_ID), authResponse.accessToken);
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
                    const databaseInstance = await connectionPool.connect();
                    const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${file.id}'`;
                    const selectQueryResponse = await databaseInstance.query(selectQuery);

                    if (selectQueryResponse && selectQueryResponse.rowCount >= 1) {
                        databaseInstance.release();
                        console.log("File already processed...");
                        continue;
                    }

                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${file.id}', '${file.name}', 'INPROGRESS','${currentDateTimestamp}','OFFICE365_FILE_SYNC_SCHEDULER') RETURNING id;`

                    const insertQueryResponse = await databaseInstance.query(insertQuery);
                    if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                        databaseInstance.release();
                        console.log("Error ocurred while inserting tracking record...");
                        continue;
                    }

                    const fileSyncStatusId = insertQueryResponse?.rows[0].id

                    sendFileSyncStatusEmail(clientData.dbConnectionString, fileSyncStatusId, "Quotation Rates");

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
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                        WHERE id = '${fileSyncStatusId}';`;

                    const updateQueryResponse = await databaseInstance.query(updateQuery);
                    databaseInstance.release();
                    sendFileSyncStatusEmail(clientData.dbConnectionString, fileSyncStatusId, "Quotation Rates");



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
        console.log("File processing failed during DB insertion - ", error);
    }
    console.log('COMPLETED');
}

let chargesSyncInProgress = false;

const getAndProcessLocalChargesForAll = async () => {
    try {
        if (chargesSyncInProgress) {
            console.log("Charges AutoSync Already InProgress");
            return;
        }
        chargesSyncInProgress = true;
        const adminPortalAccessToken = await getAdminPortalAccessToken();

        const clientList = await getClientList(adminPortalAccessToken);
        const clientsMap = clientList.reduce((acc, client) => {
            acc[client.clientName] = { ...client, logo: null };
            return acc;
        }, {});

        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, process.env.OFFICE365_CLIENT_CHARGES_FOLDER_ID), authResponse.accessToken);
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
                const chunkSize = 1;
                console.log("chunkSize - ", chunkSize);
                for (let fileChunkIndex = 0; fileChunkIndex < files.length; fileChunkIndex += chunkSize) {
                    console.log("Processing chunk - ", fileChunkIndex + 1);
                    const fileChunk = files.slice(fileChunkIndex, fileChunkIndex + chunkSize);

                    let promisesArray = [];
                    for (let fileChunkInnerIndex = 0; fileChunkInnerIndex < fileChunk?.length; fileChunkInnerIndex++) {

                        const fileIndex = fileChunkIndex + fileChunkInnerIndex;
                        const processSingleChargeFile = async () => {
                            let chargesfileSyncStatusId = 0;
                            const file = files[fileIndex];
                            const fileName = file.name;
                            console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                            const config = parse(clientData.dbConnectionString);
                            config.ssl = {
                                rejectUnauthorized: false
                            }

                            const connectionPool = new Pool(config);
                            const databaseInstance = await connectionPool.connect();

                            const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${file.id}'`;
                            const selectQueryResponse = await databaseInstance.query(selectQuery);
                            if (selectQueryResponse && selectQueryResponse.rowCount >= 1) {
                                databaseInstance.release();
                                console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                                console.log("File already processed...");
                                return;
                            }
                            let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                            const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${file.id}', '${file.name}', 'INPROGRESS','${currentDateTimestamp}','OFFICE365_FILE_SYNC_SCHEDULER') RETURNING id;`

                            const insertQueryResponse = await databaseInstance.query(insertQuery);
                            if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                                databaseInstance.release();
                                console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                                console.log("Error ocurred while inserting tracking record...");
                                return;
                            }
                            chargesfileSyncStatusId = insertQueryResponse?.rows[0].id;
                            sendFileSyncStatusEmail(clientData.dbConnectionString, chargesfileSyncStatusId, "Local Charges");

                            const filePath = path.join(__dirname, fileName);
                            try {
                                const fileContentStream = await office365.callApi(office365.apiConfig.fileContentByItemId(driveId, file.id), authResponse.accessToken, {
                                    responseType: 'stream'
                                });
                                const writeStream = fs.createWriteStream(filePath);
                                fileContentStream.pipe(writeStream);
                                await new Promise((resolve, reject) => {
                                    writeStream.on('finish', resolve);
                                    writeStream.on('error', reject);
                                });
                                const detail = await processExcelDocument(filePath, clientData.dbConnectionString, "Local Charges", 'ZOHO_SYNC_LOG_' + fileName + '.txt')

                                currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                                const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                        WHERE id = '${chargesfileSyncStatusId}';`;

                                const updateQueryResponse = await databaseInstance.query(updateQuery);

                                if (updateQueryResponse && updateQueryResponse?.rowCount > 0) {
                                    console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                                    console.log("----File processed successfully and status updated in DB----");
                                } else {
                                    console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                                    console.log("----File processed successfully and failed to update status in DB----");
                                }
                            } catch (innerError) {
                                console.log("ClientName: " + client.name + " | Carrier: " + carrier.name + " | FileName: " + fileName);
                                console.log("File processing failed during content extraction and DB insertion - ", innerError);
                                currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                                const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'FAILED', details = '${innerError}',updated_on = '${currentDateTimestamp}', updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                        WHERE id = '${chargesfileSyncStatusId}';`;
                                await databaseInstance.query(updateQuery);
                            } finally {
                                databaseInstance.release();
                                sendFileSyncStatusEmail(clientData.dbConnectionString, chargesfileSyncStatusId, "Local Charges");
                                await deleteFile(filePath);
                            }
                        }
                        promisesArray.push(processSingleChargeFile());
                    }
                    await Promise.all(promisesArray);
                }
            }
        }
    } catch (error) {
        chargesSyncInProgress = false;
        console.log("File processing failed - ", error);
    } finally {
        chargesSyncInProgress = false;
    }
    console.log('COMPLETED');
}

const getAndProcessDndForAll = async () => {
    try {
        const adminPortalAccessToken = await getAdminPortalAccessToken();

        const clientList = await getClientList(adminPortalAccessToken);
        const clientsMap = clientList.reduce((acc, client) => {
            acc[client.clientName] = { ...client, logo: null };
            return acc;
        }, {});

        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, process.env.OFFICE365_CLIENT_DND_FOLDER_ID), authResponse.accessToken);
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
                    const databaseInstance = await connectionPool.connect();
                    const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${file.id}'`;
                    const selectQueryResponse = await databaseInstance.query(selectQuery);
                    if (selectQueryResponse && selectQueryResponse.rowCount >= 1) {
                        databaseInstance.release();
                        console.log("File already processed...");
                        continue;
                    }

                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${file.id}', '${file.name}', 'INPROGRESS','${currentDateTimestamp}','OFFICE365_FILE_SYNC_SCHEDULER') RETURNING id;`

                    const insertQueryResponse = await databaseInstance.query(insertQuery);
                    if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                        databaseInstance.release();
                        console.log("Error ocurred while inserting tracking record...");
                        continue;
                    }
                    const dndFileSyncStatusId = insertQueryResponse?.rows[0].id

                    sendFileSyncStatusEmail(clientData.dbConnectionString, dndFileSyncStatusId, "Dnd Charges");

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
                    const detail = await processExcelDocument(filePath, clientData.dbConnectionString, "Dnd Charges", 'ZOHO_SYNC_LOG_' + fileName + '.txt')

                    currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                        WHERE id = '${dndFileSyncStatusId}';`;

                    const updateQueryResponse = await databaseInstance.query(updateQuery);
                    databaseInstance.release();

                    sendFileSyncStatusEmail(clientData.dbConnectionString, dndFileSyncStatusId, "Dnd Charges");

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
        console.log("File processing failed during DB insertion - ", error);
    }
    console.log('COMPLETED');
}

const getAndProcessQuotationonlineRatesForAll = async () => {
    try {
        const adminPortalAccessToken = await getAdminPortalAccessToken();
        const clientList = await getClientList(adminPortalAccessToken);
        const clientsMap = clientList.reduce((acc, client) => {
            acc[client.clientName] = { ...client, logo: null };
            return acc;
        }, {});

        const authResponse = await office365.getToken(office365.tokenRequest);
        const driveId = process.env.OFFICE365_DRIVE_ID;
        const clientsResponse = await office365.callApi(office365.apiConfig.driveFolderByItemId(driveId, process.env.OFFICE365_CLIENT_ONLINERATES_FOLDER_ID), authResponse.accessToken);
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
                    const databaseInstance = await connectionPool.connect();
                    const selectQuery = `SELECT doc_id FROM quotation_rate_excel_sync WHERE status = 'COMPLETED' AND doc_id='${file.id}'`;
                    const selectQueryResponse = await databaseInstance.query(selectQuery);
                    if (selectQueryResponse && selectQueryResponse.rowCount >= 1) {
                        databaseInstance.release();
                        console.log("File already processed...");
                        continue;
                    }

                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const insertQuery = `INSERT INTO quotation_rate_excel_sync(
                            doc_id, doc_name, status,created_on, created_by)
                            VALUES ('${file.id}', '${file.name}', 'INPROGRESS','${currentDateTimestamp}','OFFICE365_FILE_SYNC_SCHEDULER') RETURNING id;`

                    const insertQueryResponse = await databaseInstance.query(insertQuery);
                    if (!insertQueryResponse || insertQueryResponse.rowCount !== 1) {
                        databaseInstance.release();
                        console.log("Error ocurred while inserting tracking record...");
                        continue;
                    }
                    const onlineRateFileSyncStatusId = insertQueryResponse?.rows[0].id

                    sendFileSyncStatusEmail(clientData.dbConnectionString, onlineRateFileSyncStatusId, "Online Rates");

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
                    const detail = await processExcelDocument(filePath, clientData.dbConnectionString, "Online Rates", 'ZOHO_SYNC_LOG_' + fileName + '.txt')

                    currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const updateQuery = `UPDATE quotation_rate_excel_sync
                        SET status = 'COMPLETED', details = '${JSON.stringify(detail)}',updated_on = '${currentDateTimestamp}', updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                        WHERE id = '${onlineRateFileSyncStatusId}';`;

                    const updateQueryResponse = await databaseInstance.query(updateQuery);
                    databaseInstance.release();
                    sendFileSyncStatusEmail(clientData.dbConnectionString, onlineRateFileSyncStatusId, "Online Rates");

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
        console.log("File processing failed during DB insertion - ", error);
    }
    console.log('COMPLETED');
}

const contractRateExpires = async (req, res) => {
    try {
        const date = new Date()
        const expiresDate = moment(date, "MM/DD/YYYY").add(7, 'days').format('MM/DD/YYYY');
        const query = `SELECT DISTINCT carrier,contract_number,validity_date_to::date
        FROM quotation_rate_output
        WHERE validity_date_to::date = '${expiresDate}' `;

        const adminPortalAccessToken = await getAdminPortalAccessToken();
        const clientList = await getClientList(adminPortalAccessToken);
        let allResults = [];
        for (let clientIndex = 0; clientIndex < clientList.length; clientIndex++) {
            const client = clientList[clientIndex];
            if (client?.dbConnectionString == 'NA') {
                continue;
            }
            const config = parse(client?.dbConnectionString);
            config.ssl = {
                rejectUnauthorized: false
            }
            const connectionPool = new Pool(config);
            const databaseInstance = await connectionPool.connect();
            const queryResponse = await databaseInstance.query(query);
            databaseInstance.release();

            if (queryResponse) {
                const result = queryResponse?.rows?.map((row) => ({
                    contract_number: row.contract_number,
                    validity_date_to: row.validity_date_to,
                    carrier: row.carrier
                })) || [];

                const emailId = [process.env.RATE_EXPIRY_RECIPIENTS_EMAIL];
                for (const element of result) {
                    const validDate = moment(element.validity_date_to).format('MM/DD/YYYY');
                    const mailSubject = `Contract Rates Expiring Soon - ${validDate} - ${element.contract_number} - ${element.carrier}`;

                    const mailBodyHTML = contractRatesExpires(element, validDate);
                    await sendMail(
                        emailId,
                        mailSubject,
                        mailBodyHTML,
                        "",
                    );
                    console.log("Contract expiry mail sent to - ", emailId);
                }
                allResults = [...allResults, result];
            }
        }
        if (allResults?.length > 0) {
            res?.status(OK).send({ message: "Expires Email sent successfully", allResults });
        } else {
            res?.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while expires email sent" });
        }
    } catch (err) {
        console.log(err);
        res?.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
}

const sendFileSyncStatusEmail = async (dbConnectionString, fileSyncRequestId, type) => {
    const config = parse(dbConnectionString);
    config.ssl = {
        rejectUnauthorized: false
    }
    const connectionPool = new Pool(config);
    databaseInstance = await connectionPool.connect();
    const query = `SELECT * FROM quotation_rate_excel_sync WHERE id = '${fileSyncRequestId}'`;
    const queryResponse = await databaseInstance.query(query);
    databaseInstance.release();
    const data = queryResponse.rows;

    const mailSubject = `FileSync - ${type} - ${data[0].status} - ${data[0].doc_name}`;
    const text = data?.length > 0 ? JSON.stringify(data[0]) : "No File sync request details found";
    const receiverEmailIds = [process.env.OFFICE365_FILESYNC_ALERTS_RECEIVERS];
    await sendMail(
        receiverEmailIds,
        mailSubject,
        "",
        text,
    );
}

module.exports = {
    contractRateExpires,
    getAndProcessQuotationRateExcel,
    getIfNumber,
    getPgSQLFormattedDate,
    doGetAndProcessPortsDataExcel,
    deleteFile,
    getFolders,
    getAndProcessQuotationRatesForAll,
    getAndProcessLocalChargesForAll,
    getAndProcessDndForAll,
    getAndProcessQuotationonlineRatesForAll,
}