require("dotenv").config();
const excelToJson = require("convert-excel-to-json");
const moment = require("moment");
const sql = require("sql");
const axios = require("axios");
const fs = require("fs/promises");
const executeQuery = require("../../db/connect");
const {
    NOT_FOUND,
    INTERNAL_SERVER_ERROR,
    OK,
    BAD_REQUEST,
} = require("../../utils/apiStatus");
const getMyQuotationPDFHTML = require("../../utils/pdf/my-quotation");
const { uploadQuotationDocument, uploadLogFile } = require("../../utils/aws");
const { sendMail } = require("../../utils/email/email");
const pdf = require("html-pdf");
const {
    addNotificationAndEmit,
} = require("../notifications/notifications.service");
const { getTrips } = require("../schedule/schedule.service");
const { getQuotationTemplate } = require("../../utils/email/templates/quotation");
const { kuulieLogo } = require("../../utils/image-constants");
const { noRatesTemplate } = require("../../utils/email/templates/noRates");
const { noRatesAdminTemplate } = require("../../utils/email/templates/noRatesAdmin");

const { Pool } = require('pg')
const { parse } = require('pg-connection-string');
const { quoteConfirmTemplate } = require("../../utils/email/templates/quoteConfirmTemplate");
const { SCHEDULE_TRIP_LIST } = require("../../utils/common-constants");
const { getAllCurrenciesMap } = require("../currency/currency.service");
const { toRoundedFixed } = require("../../utils/services/shared.service");
const { getRealtimeSpotRates } = require("./spot-rate.service");
const { getCache, setExpirableCache } = require("../../utils/redis-service");
const { quotePendingRequestTemplate } = require("../../utils/email/templates/quotePendingRequestTemplate");
const { contractRatesAvailable } = require("../../utils/email/templates/contractRateAvailable");
const { getQuotationDocx } = require("./docx/docx.service");
const { getQuotationPdf } = require("./docx/pdf.service");
const CHARGE_RATE_CACHE_EXPIRY_TIME = process.env.GEEKYUM_CHARGE_RATE_CACHE_EXPIRY_TIME;

const escapeText = (client, data) => client.escapeLiteral(data);

const getConnectionPool = (dbConnectionString) => {
    const config = parse(dbConnectionString);
    config.ssl = {
        rejectUnauthorized: false
    }
    return new Pool(config);
}

const originChargeTypes = ["export", "freight"];
const destinationChargeTypes = ["import", "b/l"];

const onLoadQuotations = async (req, res) => {
    const query = "SELECT * FROM onload_quotation";
    const commodityQuery = "SELECT * FROM commodity_hs_code";

    try {
        return executeQuery(query, req.dbConnectionString).then(async (data) => {
            const containerType = [];
            const incoterms = [];
            const terms = [];
            const ports = [];

            data.rows.forEach((ca) => {
                if (ca.container_type !== "") {
                    containerType.push({
                        label: ca.container_type,
                        value: ca.container_type,
                    });
                }
                if (ca.ports !== "") {
                    ports.push({
                        label: ca.ports,
                        value: ca.ports,
                        lat: ca.lat,
                        lng: ca.lng,
                    });
                }

                if (ca.incoterms !== "") {
                    incoterms.push({
                        label: ca.incoterms,
                        value: ca.incoterms,
                    });
                }

                if (ca.terms !== "") {
                    terms.push({
                        label: ca.terms,
                        value: ca.terms,
                    });
                }
            });

            const commodities = await executeQuery(
                commodityQuery,
                req.dbConnectionString
            );

            const json = {
                portOfLoading: ports,
                portOfDischarge: ports,
                containerType: containerType,
                incoterms: incoterms,
                terms: terms,
                commodity: commodities?.rows,
            };
            res.status(OK).send({ data: json, message: "fetched." });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getIfNumber = (s) => (isNaN(s) ? 0 : +s);

const getChargeValue = (s) => String(s)?.trim();

const getDataIfUndefined = (value) => {
    if (value === undefined) {
        return '';
    } else {
        return value;
    }
};

let getPgSQLFormattedDate = (date) => {
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
let getPgSQLFormattedDateTime = (date) => {
    try {
        let momentInstance = moment(date);
        if (!momentInstance?.isValid()) {
            momentInstance = moment(date, 'DD/MM/YYYY');
        }
        return momentInstance.format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
        console.log("Error - ", error)
    }
}

let removeApostrophe = (chargeName) => {
    return chargeName.replace(/'/g, '"');
}

const processExcelDocument = async (
    sourceFile,
    dbConnectionString,
    documentName,
    logFileName
) => {
    const excelJson = excelToJson({ sourceFile });
    console.log(sourceFile, "sourceFile", documentName);
    const sheets = Object.keys(excelJson || {});
    const sheetName = sheets[0];
    let excelData = [];
    switch (documentName) {
        case "Quotation Rates":
            excelData =
                excelJson && excelJson[sheetName]
                    ? excelJson[sheetName].slice(2)
                    : [];

            console.log("Number of rows Quote - ", excelData.length);

            let records = {
                total: excelData.length,
                successful: 0,
                failed: 0,
            };
            const contractRatePreinsertionTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            const pool = getConnectionPool(dbConnectionString);
            const client = await pool.connect();

            const chunkSize = 100;
            for (let i = 0; i < excelData?.length; i += chunkSize) {
                console.log("Processing chunk - ", i + 1);
                const chunk = excelData.slice(i, i + chunkSize);

                for (let j = 0; j < chunk?.length; j++) {

                    const row = chunk[j];

                    const contractType = row.B;
                    const carrier = row.C;
                    const vessel = getDataIfUndefined(row.D);
                    const voyageNumber = getDataIfUndefined(row.E);
                    const socCoc = row.F;
                    const contractNumber = row.G;
                    const validityDateFrom = getPgSQLFormattedDate(row.H);
                    const validityDateTo = getPgSQLFormattedDate(row.I);
                    const origin = row.J;
                    const destination = row.K;
                    const currency = row.L
                    const tariff20 = getIfNumber(row.M);
                    const tariff40 = getIfNumber(row.N);
                    const tariff40HC = getIfNumber(row.O);
                    const tariff45 = getIfNumber(row.P);
                    const reefer20 = getIfNumber(row.Q);
                    const reefer40 = getIfNumber(row.R);
                    const reefer40HC = getIfNumber(row.S);
                    const nor20 = getIfNumber(row.T);
                    const nor40 = getIfNumber(row.U);
                    const nor40HC = getIfNumber(row.V);
                    const via = getDataIfUndefined(row.W);
                    const route_code = getDataIfUndefined(row.X);
                    const contractOwner = getDataIfUndefined(row.Y);
                    const remarks = getDataIfUndefined(row.Z);

                    const file_number = getIfNumber(row.AA);
                    if (file_number === 0) {
                        throw new Error("File Number " + file_number + " is not valid. Please check the file.");
                    }

                    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

                    const insertQuery = `
              DO
              $do$
              BEGIN  
                  IF NOT EXISTS (SELECT 1
                  FROM quotation_rate_output
                  WHERE contract_type = '${contractType}'
                  AND contract_number = '${contractNumber}'
                  AND carrier = '${carrier}'
                  AND validity_date_from = '${validityDateFrom}'
                  AND validity_date_to = '${validityDateTo}'
                  AND origin ILIKE '${origin}'
                  AND destination ILIKE '${destination}'
                  AND via = '${via}')
                  THEN
                      INSERT INTO quotation_rate_output
                      ( contract_type
                      , carrier
                      , vessel
                      , voyage_number
                      , soc_coc
                      , contract_number
                      , validity_date_from
                      , validity_date_to, origin
                      , destination
                      , currency
                      , tariff_20
                      , tariff_40
                      , tariff_40hc
                      , tariff_45
                      , reefer_20
                      , reefer_40
                      , reefer_40hc
                      , nor_20
                      , nor_40
                      , nor_40hc
                      , via
                      , route_code
                      , contract_owner
                      , remarks
                      , created_on
                      , created_by
                      , file_number)
                      VALUES
                      ( '${contractType}'
                      , '${carrier}'
                      , '${vessel}'
                      , '${voyageNumber}'
                      , '${socCoc}'
                      , '${contractNumber}'
                      , '${validityDateFrom}'
                      , '${validityDateTo}'
                      , '${origin}'
                      , '${destination}'
                      , '${currency}'
                      , ${tariff20}
                      , ${tariff40}
                      , ${tariff40HC}
                      , ${tariff45}
                      , ${reefer20}
                      , ${reefer40}
                      , ${reefer40HC}
                      , ${nor20}
                      , ${nor40}
                      , ${nor40HC}
                      , '${via}'
                      , '${route_code}'
                      , '${contractOwner}' 
                      , '${remarks}'
                      , '${currentDateTimestamp}'
                      , 'OFFICE365_FILE_SYNC_SCHEDULER'
                      , ${file_number}
                      );
                  ELSE
                      UPDATE quotation_rate_output
                      SET tariff_20 = ${tariff20}
                          ,tariff_40 = ${tariff40}
                          ,tariff_40hc = ${tariff40HC}
                          ,tariff_45 = ${tariff45} 
                          ,reefer_20 = ${reefer20}
                          ,reefer_40 = ${reefer40}
                          ,reefer_40hc = ${reefer40HC}
                          ,nor_20 = ${nor20}
                          ,nor_40 = ${nor40}
                          ,nor_40hc = ${nor40HC}
                          ,remarks = '${remarks}'
                          ,updated_on = '${currentDateTimestamp}'
                          ,updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                          ,currency = '${currency}'
                          ,vessel = '${vessel}'
                          ,voyage_number = '${voyageNumber}'
                          ,soc_coc = '${socCoc}'     
                          ,contract_owner = '${contractOwner}'
                          ,route_code = '${route_code}'
                          ,file_number = ${file_number}
                      WHERE contract_type = '${contractType}'
                          AND contract_number = '${contractNumber}'
                          AND carrier = '${carrier}'
                          AND validity_date_from = '${validityDateFrom}'
                          AND validity_date_to = '${validityDateTo}'
                          AND origin ILIKE '${origin}'
                          AND destination ILIKE '${destination}'
                          AND via = '${via}';
                END IF;
              END
              $do$`;


                    const insertQueryResponse = await client.query(insertQuery);
                    if (insertQueryResponse && insertQueryResponse.name !== "error") {
                        records.successful++;
                    } else {
                        console.log("FAILED - ", insertQuery, insertQueryResponse)
                        records.failed++;
                        console.log("Failed Row Number ", i + 1);
                        console.log("insertQueryResponse ---", insertQueryResponse);
                        console.log("row ---", row);
                        console.log("insertQuery ---", insertQuery);

                        await fs.appendFile(
                            logFileName,
                            `
----------------------------------------------------
${String(insertQueryResponse)}
Failed Row Number - ${i + 1}
Row - ${JSON.stringify(row)}
Query - ${insertQuery}
----------------------------------------------------
`
                        );
                    }
                }
            }
            client.release();
            await uploadLogFile(logFileName);
            sendContractRatesAvailableEmail(dbConnectionString, contractRatePreinsertionTimestamp)
            return records;
        case "Online Rates":
            excelData = excelJson?.Sheet1?.slice(1);
            console.log("ExcelData Length", excelData.length)
            let onlineRateRecords = {
                total: excelData.length,
                successful: 0,
                failed: 0,
            };
            const poolForOnlineRate = getConnectionPool(dbConnectionString);
            const clientForOnlineRate = await poolForOnlineRate.connect();
            const chunkSizeForOnlineRate = 100;

            for (let i = 0; i < excelData?.length; i += chunkSizeForOnlineRate) {
                console.log("Processing chunk - ", i + 1);
                if (i === 0) {
                    console.log(excelData[i]);
                }
                const chunk = excelData.slice(i, i + chunkSizeForOnlineRate);

                for (let j = 0; j < chunk?.length; j++) {
                    const row = chunk[j];

                    const pol_code = row.A
                    const pol_name = row.B
                    const pod_code = row.C
                    const pod_name = row.D
                    const via_way_name = getDataIfUndefined(row.E);
                    const Carrier = row.F
                    const destinationFreeTimeChargesDemurrage20gp = getIfNumber(row.G);
                    const destinationFreeTimeChargesDemurrage40gp = getIfNumber(row.H);
                    const destinationFreeTimeChargesDemurrage40hc = getIfNumber(row.I);
                    const frequency = row.J;
                    const transport_day = row.K;
                    const etd = getPgSQLFormattedDate(row.L);
                    const eta = getPgSQLFormattedDate(row.M)
                    const vessel_name = row.N;
                    const voyage = row.O;
                    const route_code = row.P;
                    const updated_on = getPgSQLFormattedDateTime(row.Q);
                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

                    const onlineRateRecordsInsertQuery = `
                            DO
                            $do$
                            BEGIN  
                            IF NOT EXISTS(SELECT 1
                                FROM online_rates
                                WHERE pol_code = '${pol_code}'
                                AND pol_name = '${pol_name}'
                                AND pod_code = '${pod_code}'
                                AND pod_name = '${pod_name}'
                                AND via_way_name = '${via_way_name}'
                                AND carrier_code = '${Carrier}'
                                AND etd = '${etd}'
                                AND eta = '${eta}') THEN
                                INSERT INTO online_rates
                                ( pol_code
                                    , pol_name
                                    , pod_code
                                    , pod_name
                                    , via_way_name
                                    , carrier_code
                                    , tariff_20gp
                                    , tariff_40gp
                                    , tariff_40hc
                                    , frequency
                                    , transport_day
                                    , etd
                                    , eta
                                    , vessel_name
                                    , voyage
                                    , route_code
                                    , updated_on
                                    , created_on
                                    , created_by
                                 )
                                 VALUES
                                    ('${pol_code}'
                                    , '${pol_name}'
                                    , '${pod_code}'
                                    , '${pod_name}'
                                    , '${via_way_name}'
                                    , '${Carrier}'
                                    , '${destinationFreeTimeChargesDemurrage20gp}'
                                    , '${destinationFreeTimeChargesDemurrage40gp}'
                                    , '${destinationFreeTimeChargesDemurrage40hc}'
                                    , '${frequency}'
                                    , '${transport_day}'
                                    , '${etd}'
                                    , '${eta}'
                                    , '${vessel_name}'
                                    , '${voyage}'
                                    , '${route_code}'
                                    , '${updated_on}'
                                    , '${currentDateTimestamp}'
                                    , 'OFFICE365_FILE_SYNC_SCHEDULER'
                                );
                            ELSE
                                    UPDATE online_rates
                                    SET tariff_20gp = '${destinationFreeTimeChargesDemurrage20gp}'
                                    , tariff_40gp = '${destinationFreeTimeChargesDemurrage40gp}'
                                    , tariff_40hc = '${destinationFreeTimeChargesDemurrage40hc}'
                                    , frequency = '${frequency}'
                                    , transport_day = '${transport_day}'
                                    , vessel_name = '${vessel_name}'
                                    , voyage = '${voyage}'
                                    , route_code = '${route_code}'                                    
                                    , updated_on = '${currentDateTimestamp}'
                                    , updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                                    WHERE pol_code = '${pol_code}'
                                    AND pol_name = '${pol_name}'
                                    AND pod_code = '${pod_code}'
                                    AND pod_name = '${pod_name}'
                                    AND via_way_name = '${via_way_name}'
                                    AND carrier_code = '${Carrier}'
                                    AND etd = '${etd}'
                                    AND eta = '${eta}';
                            END IF;
                            END
                            $do$`;
                    const chargesOnlineRateRecordsInsertQueryResponse = await clientForOnlineRate.query(onlineRateRecordsInsertQuery)
                    if (
                        chargesOnlineRateRecordsInsertQueryResponse &&
                        chargesOnlineRateRecordsInsertQueryResponse.name !== "error"
                    ) {
                        onlineRateRecords.successful++;
                    } else {
                        onlineRateRecords.failed++;
                        console.log("Failed Row Number ", i + 1);
                        console.log(
                            "insertQueryResponse ---",
                            chargesOnlineRateRecordsInsertQueryResponse
                        );
                        console.log("insertQuery ---", onlineRateRecordsInsertQuery);
                        await fs.appendFile(
                            logFileName,
                            `
        ----------------------------------------------------
            ${String(chargesOnlineRateRecordsInsertQueryResponse)}
        Failed Row Number - ${i + 1}
        Row - ${JSON.stringify(row)}
        Query - ${onlineRateRecordsInsertQuery}
        ----------------------------------------------------
            `
                        );
                    }
                }
            }
            clientForOnlineRate.release();
            await uploadLogFile(logFileName);
            return onlineRateRecords;

        case "Local Charges":
            excelData =
                excelJson && excelJson[sheetName]
                    ? excelJson[sheetName].slice(3)
                    : [];

            console.log("Number of rows charges - ", excelData.length);

            let chargesRecords = {
                total: excelData.length,
                successful: 0,
                failed: 0,
            };
            const poolForCharges = getConnectionPool(dbConnectionString);
            const clientForCharges = await poolForCharges.connect();

            const chunkSizeForCharges = 100;
            for (let i = 0; i < excelData?.length; i += chunkSizeForCharges) {
                console.log("Processing chunk - ", i + 1, chunkSizeForCharges, " | File: " + sourceFile);
                const chunk = excelData.slice(i, i + chunkSizeForCharges);

                for (let j = 0; j < chunk?.length; j++) {
                    const row = chunk[j];

                    const validityDateFrom = getPgSQLFormattedDate(row.B);
                    const validityDateTo = getPgSQLFormattedDate(row.C);
                    const origin = row.D;
                    const destination = row.E;
                    const chargeType = row.F;
                    const chargeName = removeApostrophe(row.G);
                    const chargeCode = row.H;
                    const currency = row.I;
                    const tariff20 = getChargeValue(row.J || "");
                    const tariff40 = getChargeValue(row.K || "");
                    const tariff40hc = getChargeValue(row.L || "");
                    const tariff45 = getChargeValue(row.M || "")
                    const via = row.N ? row.N?.trim() : "";
                    const exportImport = row.O;
                    const mandatoryExtra = row.P;
                    const carrier = row.Q;
                    const contract_number = row.R;
                    const remarks = row.S ? row.S.trim() : "";

                    const file_number = getIfNumber(row.T);
                    if (file_number === 0) {
                        throw new Error("File Number " + file_number + " is not valid. Please check the file.");
                    }

                    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    const chargesRecordsToInsert = `
                    DO
                    $do$
                    BEGIN  
                        IF NOT EXISTS (SELECT 1
                            FROM quotation_local_charges
                            WHERE validity_date_from = '${validityDateFrom}'
                            AND validity_date_to = '${validityDateTo}'
                            AND origin ILIKE '${origin}'
                            AND destination ILIKE '${destination}'
                            AND via ILIKE '${via}'
                            AND charge_type = '${chargeType}'
                            AND charge_name = '${chargeName}'
                            AND charge_code = '${chargeCode}'
                            AND carrier = '${carrier}'                              
                            AND export_import = '${exportImport}'
                            ) THEN
                            INSERT INTO quotation_local_charges
                            (  validity_date_from
                              , validity_date_to
                              , origin
                              , destination
                              , via
                              , charge_type
                              , charge_name
                              , charge_code
                              , currency
                              , tariff_20
                              , tariff_40
                              , tariff_40hc
                              , tariff_45
                              , export_import
                              , mandatory_extra
                              , carrier
                              , contract_number
                              , remarks
                              , created_on
                              , created_by
                              , file_number
                            )
                            VALUES
                            ( '${validityDateFrom}'
                            , '${validityDateTo}'
                            , '${origin}'
                            , '${destination}'
                            , '${via}'
                            , '${chargeType}'
                            , '${chargeName}'
                            , '${chargeCode}'
                            , '${currency}'
                            , '${tariff20}'
                            , '${tariff40}'
                            , '${tariff40hc}'
                            , '${tariff45}'
                            , '${exportImport}'
                            , '${mandatoryExtra}'
                            , '${carrier}'
                            , '${contract_number}'
                            , ${escapeText(clientForCharges, remarks)}
                            , '${currentDateTimestamp}'
                            , 'OFFICE365_FILE_SYNC_SCHEDULER'
                            , ${file_number});
                        ELSE
                            UPDATE quotation_local_charges
                            SET tariff_20 = '${tariff20}'
                              , tariff_40 = '${tariff40}'
                              , tariff_40hc = '${tariff40hc}'
                              , tariff_45 = '${tariff45}'
                              , currency = '${currency}'
                              , mandatory_extra = '${mandatoryExtra}'
                              , remarks = ${escapeText(clientForCharges, remarks)}
                              , contract_number = '${contract_number}'
                              , updated_on = '${currentDateTimestamp}'
                              , updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER'
                              , file_number = ${file_number}                            
                            WHERE validity_date_from = '${validityDateFrom}'
                              AND validity_date_to = '${validityDateTo}'
                              AND origin ILIKE '${origin}'
                              AND destination ILIKE '${destination}'
                              AND via ILIKE '${via}'
                              AND charge_type = '${chargeType}'
                              AND charge_name = '${chargeName}'
                              AND charge_code = '${chargeCode}'
                              AND carrier = '${carrier}'                              
                              AND export_import = '${exportImport}';
                        END IF;
                    END
                    $do$`;

                    const chargesRecordsInsertQueryResponse = await clientForCharges.query(chargesRecordsToInsert)
                    if (
                        chargesRecordsInsertQueryResponse &&
                        chargesRecordsInsertQueryResponse.name !== "error"
                    ) {
                        chargesRecords.successful++;
                    } else {
                        chargesRecords.failed++;
                        console.log("Failed Row Number ", i + 1);
                        console.log(
                            "insertQueryResponse ---",
                            chargesRecordsInsertQueryResponse
                        );
                        console.log("row ---", row);
                        console.log("insertQuery ---", chargesRecordsToInsert);

                        await fs.appendFile(
                            logFileName,
                            `
                    ----------------------------------------------------
                    ${String(chargesRecordsInsertQueryResponse)}
                    Failed Row Number - ${i + 1}
                    Row - ${JSON.stringify(row)}
                    Query - ${chargesRecordsToInsert}
                    ----------------------------------------------------
                        `
                        );
                    }
                }
            }
            clientForCharges.release();
            await uploadLogFile(logFileName);
            return chargesRecords;

        case "Dnd Charges":
            excelData = excelJson?.Sheet1?.slice(3);
            console.log("Number of rows Dnd - ", excelData.length)

            let dndRecords = {
                total: excelData.length,
                successful: 0,
                failed: 0,
            };
            const poolForDnd = getConnectionPool(dbConnectionString);
            const clientForDnd = await poolForDnd.connect();

            const chunkSizeForDnd = 100;
            for (let i = 0; i < excelData?.length; i += chunkSizeForDnd) {
                console.log("Processing chunk - ", i + 1);
                const chunk = excelData.slice(i, i + chunkSizeForDnd);

                for (let j = 0; j < chunk?.length; j++) {
                    const row = chunk[j];

                    const type = row.B;
                    const carrier = row.C;
                    const origin = row.D;
                    const contractNumber = row.E;
                    const validityDateFrom = getPgSQLFormattedDate(row.F);
                    const validityDateTo = getPgSQLFormattedDate(row.G);
                    const originPort = row.H;
                    const destinationPort = row.I;
                    const freeTime = getIfNumber(row.J);
                    const dayRange = row.K;
                    const currency = row.L;
                    const destinationFreeTimeChargesDemurrage20 = getIfNumber(row.M);
                    const destinationFreeTimeChargesDemurrage40 = getIfNumber(row.N);
                    const destinationFreeTimeChargesDemurrage40HC = getIfNumber(row.O);
                    const category = row.P;
                    const exportImport = row.Q;
                    const remarks = row.R;
                    let currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

                    const dndRecordsInsertQuery = `
                    DO
                    $do$
                    BEGIN  
                    IF NOT EXISTS(SELECT 1
                        FROM demurrage_and_detention_v2
                        WHERE type = '${type}'
                        AND carrier = '${carrier}'
                        AND origin = '${origin}'
                        AND contract_number = '${contractNumber}'
                        AND validity_date_from = '${validityDateFrom}'
                        AND validity_date_to = '${validityDateTo}'
                        AND origin_port ILIKE '${originPort}'
                        AND destination_port ILIKE '${destinationPort}' 
                        AND day_range = '${dayRange}'
                        AND currency = '${currency}'
                        AND category = '${category}'
                        AND export_import = '${exportImport}'
                        AND remarks = '${remarks}') THEN
                        INSERT INTO demurrage_and_detention_v2
                        (type
                            , carrier
                            , origin
                            , contract_number
                            , validity_date_from
                            , validity_date_to
                            , origin_port
                            , destination_port
                            , free_time
                            , day_range
                            , currency
                            , destination_free_time_charges_demurrage_20
                            , destination_free_time_charges_demurrage_40
                            , destination_free_time_charges_demurrage_40hc
                            , category
                            , export_import
                            , remarks
                            , created_on
                            , created_by
                        )
                    VALUES
                        ('${type}'
                            , '${carrier}'
                            , '${origin}'
                            , '${contractNumber}'
                            , '${validityDateFrom}'
                            , '${validityDateTo}'
                            , '${originPort}'
                            , '${destinationPort}'
                            , '${freeTime}'
                            , '${dayRange}'
                            , '${currency}'
                            , '${destinationFreeTimeChargesDemurrage20}'
                            , '${destinationFreeTimeChargesDemurrage40}'
                            , '${destinationFreeTimeChargesDemurrage40HC}'
                            , '${category}'
                            , '${exportImport}'
                            , '${remarks}'
                            , '${currentDateTimestamp}'
                            , 'OFFICE365_FILE_SYNC_SCHEDULER'
                        );
                    ELSE
                            UPDATE demurrage_and_detention_v2
                            SET free_time = ${freeTime}
                            , destination_free_time_charges_demurrage_20 = ${destinationFreeTimeChargesDemurrage20}
                            , destination_free_time_charges_demurrage_40 = ${destinationFreeTimeChargesDemurrage40}
                            , destination_free_time_charges_demurrage_40hc = ${destinationFreeTimeChargesDemurrage40HC}

                        WHERE type = '${type}'
                            AND carrier = '${carrier}'
                            AND origin = '${origin}'
                            AND contract_number = '${contractNumber}'
                            AND validity_date_from = '${validityDateFrom}'
                            AND validity_date_to = '${validityDateTo}'
                            AND origin_port ILIKE '${originPort}'
                            AND destination_port ILIKE '${destinationPort}' 
                            AND day_range = '${dayRange}'
                            AND currency = '${currency}'
                            AND category = '${category}'
                            AND export_import = '${exportImport}'
                            AND remarks = '${remarks}'
                            AND updated_on = '${currentDateTimestamp}'
                            AND updated_by = 'OFFICE365_FILE_SYNC_SCHEDULER';
                    END IF;
                    END
                    $do$`;
                    const chargesDndRecordsInsertQueryResponse = await clientForDnd.query(dndRecordsInsertQuery)
                    if (
                        chargesDndRecordsInsertQueryResponse &&
                        chargesDndRecordsInsertQueryResponse.name !== "error"
                    ) {
                        dndRecords.successful++;
                    } else {
                        dndRecords.failed++;
                        console.log("Failed Row Number ", i + 1);
                        console.log(
                            "insertQueryResponse ---",
                            chargesDndRecordsInsertQueryResponse
                        );
                        console.log("row ---", row);
                        console.log("insertQuery ---", dndRecordsInsertQuery);
                        await fs.appendFile(
                            logFileName,
                            `
----------------------------------------------------
    ${String(chargesDndRecordsInsertQueryResponse)}
Failed Row Number - ${i + 1}
Row - ${JSON.stringify(row)}
Query - ${dndRecordsInsertQuery}
----------------------------------------------------
    `
                        );
                    }
                }
            }
            clientForDnd.release();
            await uploadLogFile(logFileName);
            return dndRecords;

    }
};

const sendContractRatesAvailableEmail = async (dbConnectionString, date_time) => {
    const config = parse(dbConnectionString);
    config.ssl = {
        rejectUnauthorized: false
    }
    const connectionPool = new Pool(config);
    databaseInstance = await connectionPool.connect();
    const query = `SELECT DISTINCT contract_number FROM quotation_rate_output WHERE created_on >= '${date_time}'`;
    const queryResponse = await databaseInstance.query(query);
    databaseInstance.release();
    const data = queryResponse?.rows?.map((row) => ({
        contract_number: row.contract_number,
    })) || [];

    const receiverEmailIds = [process.env.CONTRACT_RATE_AVAILABLE_RECIPIENTS_EMAIL];
    const contractNumbers = data.map(item => item.contract_number);
    const mailSubject = `Available contract rates`;
    const mailBodyHTML = contractRatesAvailable(contractNumbers);
    await sendMail(
        receiverEmailIds,
        mailSubject,
        mailBodyHTML,
        "",
    );
    console.log("Contract rate available mail sent to - ", receiverEmailIds);

}


const updateFileStatus = async (recordId, status, dbConnectionString) => {
    const query = `
    UPDATE automation_excel_to_json SET upload_status = '${status}' WHERE e_id = ${recordId}
`;
    await executeQuery(query, dbConnectionString);
};

const uploadAndProcessDocument = async (req, res) => {
    const authUserId = req.user.id;
    const clientId = req?.params?.clientId
        ? req?.params?.clientId
        : req.user?.client?.id;
    try {
        const { docType, documentNumber, documentName, documentProvider } =
            req.body;
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(
            getUserByAuthUserId,
            req.dbConnectionString
        );
        const user =
            userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : {};
        const query = `
                INSERT INTO automation_excel_to_json("doc_type", "doc_number", "doc_name", "doc_provider", "doc_location", "upload_status", "uploaded_on")
VALUES('${docType}', '${documentNumber}', '${documentName}', '${documentProvider}', './uploads/${req.file.filename}','uploaded', '${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}') 
                RETURNING e_id`;
        const uploadedDocumentDBLogResponse = await executeQuery(
            query,
            req.dbConnectionString
        );

        console.log(`Uploading ${docType} file.`);

        if (
            uploadedDocumentDBLogResponse &&
            uploadedDocumentDBLogResponse.rowCount === 1
        ) {
            const recordId = uploadedDocumentDBLogResponse.rows[0].e_id;
            if (docType === "Excel") {
                const logFileName = `LOG_${clientId}_${recordId}.txt`;
                const processingStatus = await processExcelDocument(
                    `./uploads/${req.file.filename}`,
                    req.dbConnectionString,
                    documentName,
                    logFileName
                );
                const userName = user.first_name + " " + user.last_name;
                const isSuccess =
                    processingStatus?.total > 0 && processingStatus.failed === 0;
                const status = `${isSuccess ? "SUCCESSFUL" : "FAILED"} - Total: ${processingStatus.total
                    }, Successful: ${processingStatus.successful}, Failed: ${processingStatus.failed
                    } `;
                await updateFileStatus(recordId, status, req.dbConnectionString);
                if (isSuccess) {
                    addNotificationAndEmit(
                        req.io,
                        req.dbConnectionString,
                        user.user_id,
                        authUserId,
                        "Automation",
                        "ALL",
                        `${userName} uploaded ${docType} `,
                        ""
                    );
                    return res.send({ message: status });
                } else {
                    return res.status(INTERNAL_SERVER_ERROR).send({ message: status });
                }
            }
            await updateFileStatus(
                recordId,
                "FAILED - Not a valid automation file type " + docType,
                req.dbConnectionString
            );
            return res.send({
                message: docType + " file uploaded but not inserted in database.",
            });
        } else {
            return res
                .status(INTERNAL_SERVER_ERROR)
                .send({
                    message: "Error ocurred while saving uploaded document in database.",
                });
        }
    } catch (err) {
        console.log("Error while uploading - ", err);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
};

const createQuotation = async (req, res) => {
    const {
        origin,
        destination,
        contractName,
        containerType,
        twentyFeetContainer,
        exportorimport,
        fourtyFeetContainer,
        fourtyFeetHighCube,
        cargoReadyDate,
        incoterms,
        terms,
        customerId,
    } = req.body;
    const query = `INSERT INTO quotation("origin", "destination", "contract_name", "container_type", "exportorimport",
    "tw_ft_container", "ft_ft_container", "ft_ft_high_cube", "cargo_ready_date",
    "incoterms", "terms", "created_on", "customer_id")
VALUES('${origin}', '${destination}', '${contractName}', '${containerType}', '${exportorimport}',
    '${twentyFeetContainer}', '${fourtyFeetContainer}', '${fourtyFeetHighCube}',
    '${cargoReadyDate}', '${incoterms}',
    '${terms}', '${moment(new Date()).format(
        "YYYY-MM-DD HH:mm:ss"
    )}', '${customerId} ')`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: "Quotation successfully inserted." });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const fetchQuotation = async (req, res) => {
    const query = "SELECT * FROM quotation;";
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ data: data.rows });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const updateQuotation = async (req, res) => {
    const {
        qId,
        origin,
        destination,
        contractName,
        exportorimport,
        containerType,
        twentyFeetContainer,
        fourtyFeetContainer,
        fourtyFeetHighCube,
        cargoReadyDate,
        incoterms,
        terms,
        customerId,
    } = req.body;
    if (!qId)
        res
            .status(NOT_FOUND)
            .send({ message: "Id not found during update operation." });
    const query = `UPDATE "quotation" 
            SET 
            "origin"='${origin}', 
            "destination"='${destination}', 
            "contract_name"='${contractName}', 
            "exportorimport"='${exportorimport}',
            "container_type"='${containerType}', 
            "tw_ft_container"='${twentyFeetContainer}', 
            "ft_ft_container"='${fourtyFeetContainer}', 
            "ft_ft_high_cube"='${fourtyFeetHighCube}',
            "customer_id"='${customerId}',
            "cargo_ready_date"='${cargoReadyDate}', 
            "incoterms"='${incoterms}', 
            "terms"='${terms}', 
            "updated_on"='${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}' 
            WHERE "q_id"='${qId}'`;

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            if (data.rowCount === 0) {
                res
                    .status(OK)
                    .send({ rowCount: data.rowCount, message: "Not data updated." });
            } else {
                res
                    .status(OK)
                    .send({
                        rowCount: data.rowCount,
                        message: "Quotation successfully updated.",
                    });
            }
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const fetchQuotationById = async (req, res) => {
    const id = req.query.id;
    if (!id)
        res.status(NOT_FOUND).send({ message: "Id not found to fetch the data" });
    const query = `SELECT * FROM quotation where q_id=${id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res
                .status(OK)
                .send({ data: data.rows, message: "Quotation successfully fectched." });
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const quotationCompanyDetails = async (req, res) => {
    const ANL = {
        companyName: "ANL",
        companyLogo: "Logo.png",
        quotationNumber: "A19943",
        validFrom: "1st April 2021",
        validTo: "30th April 2021",
        contractNumber: "ANL234",
        portOfLoading: "Shangai",
        portOfDischarge: "Melbourne",
        getAQuote: [
            {
                headerLabel: "",
                label: "oceanFreight",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "",
                label: "bunkerAdjustmentFactor",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "originCharges",
                label: "originTerminalHandlingCharges",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "originCharges",
                label: "originISPS",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "originCharges",
                label: "sealFee",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "destinationCharges",
                label: "destinationTerminalHandlingCharges",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "destinationCharges",
                label: "destinationISPS",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
            {
                headerLabel: "",
                label: "total",
                value: [
                    {
                        port20: "$1150",
                    },
                    {
                        port40: "$1150",
                    },
                    {
                        portHC: "$1150",
                    },
                ],
            },
        ],
        buyOrSell: {
            freightCharges: [
                {
                    label: "baseRate",
                    value: "1149",
                },
                {
                    label: "sulphurSurcharge",
                    value: "1149",
                },
            ],
            destinationCharges: [
                {
                    label: "destinationTerminalHandlingCharge",
                    value: "1149",
                },
            ],
            originCharges: [
                {
                    label: "exportServiceCharge",
                    value: "1149",
                },
                {
                    label: "destinationTerminalHandlingCharge",
                    value: "1149",
                },
            ],
        },
    };
    const query = `select * from quotation_company_details`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            const allData = [];
            data.rows.forEach((row) => {
                allData.push({
                    id: row.id,
                    companyName: row.company_name,
                    companyLogo: row.company_logo,
                    quotationNumber: row.quotation_number,
                    validFrom: row.valid_from,
                    validTo: row.valid_to,
                    contractNumber: row.contract_number,
                    portOfLoading: row.origin,
                    portOfDischarge: row.destination,
                    getAQuote: [
                        {
                            headerLabel: "",
                            label: "oceanFreight",
                            value: [
                                {
                                    port20: row.quote_20_oceanfreight,
                                },
                                {
                                    port40: row.quote_40_oceanfreight,
                                },
                                {
                                    portHC: row.quote_hc_oceanfreight,
                                },
                            ],
                        },
                        {
                            headerLabel: "",
                            label: "bunkerAdjustmentFactor",
                            value: [
                                {
                                    port20: row.quote_20_bunkeradjustmentfactor,
                                },
                                {
                                    port40: row.quote_40_bunkeradjustmentfactor,
                                },
                                {
                                    portHC: row.quote_hc_bunkeradjustmentfactor,
                                },
                            ],
                        },
                        {
                            headerLabel: "originCharges",
                            label: "originTerminalHandlingCharges",
                            value: [
                                {
                                    port20: row.quote_oc_20_originterminalhandlingcharges,
                                },
                                {
                                    port40: row.quote_oc_40_originterminalhandlingcharges,
                                },
                                {
                                    portHC: row.quote_oc_hc_originterminalhandlingcharges,
                                },
                            ],
                        },
                        {
                            headerLabel: "originCharges",
                            label: "originISPS",
                            value: [
                                {
                                    port20: row.quote_oc_20_originisps,
                                },
                                {
                                    port40: row.quote_oc_40_originisps,
                                },
                                {
                                    portHC: row.quote_oc_hc_originisps,
                                },
                            ],
                        },
                        {
                            headerLabel: "originCharges",
                            label: "sealFee",
                            value: [
                                {
                                    port20: row.quote_oc_20_sealfee,
                                },
                                {
                                    port40: row.quote_oc_40_sealfee,
                                },
                                {
                                    portHC: row.quote_oc_hc_sealfee,
                                },
                            ],
                        },
                        {
                            headerLabel: "destinationCharges",
                            label: "destinationTerminalHandlingCharges",
                            value: [
                                {
                                    port20: row.quote_dc_20_destinationterminalhandlingcharges,
                                },
                                {
                                    port40: row.quote_dc_40_destinationterminalhandlingcharges,
                                },
                                {
                                    portHC: row.quote_dc_hc_destinationterminalhandlingcharges,
                                },
                            ],
                        },
                        {
                            headerLabel: "destinationCharges",
                            label: "destinationISPS",
                            value: [
                                {
                                    port20: row.quote_dc_20_destinationisps,
                                },
                                {
                                    port40: row.quote_dc_40_destinationisps,
                                },
                                {
                                    portHC: row.quote_dc_hc_destinationisps,
                                },
                            ],
                        },
                        {
                            headerLabel: "",
                            label: "total",
                            value: [
                                {
                                    port20: row.quote_20_total,
                                },
                                {
                                    port40: row.quote_40_total,
                                },
                                {
                                    portHC: row.quote_hc_total,
                                },
                            ],
                        },
                    ],
                    buyOrSell: {
                        freightCharges: [
                            {
                                label: "baseRate",
                                value: row.buyorsell_fc_baserate,
                            },
                            {
                                label: "sulphurSurcharge",
                                value: row.buyorsell_fc_sulphursurcharge,
                            },
                        ],
                        destinationCharges: [
                            {
                                label: "destinationTerminalHandlingCharge",
                                value: row.buyorsell_dc_destinationterminalhandlingcharges,
                            },
                        ],
                        originCharges: [
                            {
                                label: "exportServiceCharge",
                                value: row.buyorsell_oc_exportservicecharge,
                            },
                            {
                                label: "destinationTerminalHandlingCharge",
                                value: row.buyorsell_oc_destinationterminalhandlingcharges,
                            },
                        ],
                    },
                });
            });
            res.send(allData);
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const insertQuotationCompanyDetails = async (req, res) => {
    const {
        company_name,
        company_logo,
        quotation_number,
        valid_from,
        valid_to,
        contract_number,
        port_of_loading,
        port_of_discharge,
        quote_20_oceanfreight,
        quote_40_oceanfreight,
        quote_hc_oceanfreight,
        quote_20_bunkeradjustmentfactor,
        quote_40_bunkeradjustmentfactor,
        quote_hc_bunkeradjustmentfactor,
        quote_oc_20_originterminalhandlingcharges,
        quote_oc_40_originterminalhandlingcharges,
        quote_oc_hc_originterminalhandlingcharges,
        quote_oc_20_originisps,
        quote_oc_40_originisps,
        quote_oc_hc_originisps,
        quote_oc_20_sealfee,
        quote_oc_40_sealfee,
        quote_oc_hc_sealfee,
        quote_dc_20_destinationterminalhandlingcharges,
        quote_dc_40_destinationterminalhandlingcharges,
        quote_dc_hc_destinationterminalhandlingcharges,
        quote_dc_20_destinationisps,
        quote_dc_40_destinationisps,
        quote_dc_hc_destinationisps,
        quote_20_total,
        quote_40_total,
        quote_hc_total,
        buyorsell_fc_baserate,
        buyorsell_fc_sulphursurcharge,
        buyorsell_dc_destinationterminalhandlingcharges,
        buyorsell_oc_exportservicecharge,
        buyorsell_oc_destinationterminalhandlingcharges,
    } = req.body;

    const query = `
        INSERT INTO quotation_company_details VALUES (
            DEFAULT,         
            '${company_name}',
            '${company_logo}',
            '${quotation_number}',
            '${valid_from}',
            '${valid_to}',
            '${contract_number}',
            '${port_of_loading}',
            '${port_of_discharge}',
            '${quote_20_oceanfreight}',
            '${quote_40_oceanfreight}',
            '${quote_hc_oceanfreight}',
            '${quote_20_bunkeradjustmentfactor}',
            '${quote_40_bunkeradjustmentfactor}',
            '${quote_hc_bunkeradjustmentfactor}',
            '${quote_oc_20_originterminalhandlingcharges}',
            '${quote_oc_40_originterminalhandlingcharges}',
            '${quote_oc_hc_originterminalhandlingcharges}',
            '${quote_oc_20_originisps}',
            '${quote_oc_40_originisps}',
            '${quote_oc_hc_originisps}',
            '${quote_oc_20_sealfee}',
            '${quote_oc_40_sealfee}',
            '${quote_oc_hc_sealfee}',
            '${quote_dc_20_destinationterminalhandlingcharges}',
            '${quote_dc_40_destinationterminalhandlingcharges}',
            '${quote_dc_hc_destinationterminalhandlingcharges}',
            '${quote_dc_20_destinationisps}',
            '${quote_dc_40_destinationisps}',
            '${quote_dc_hc_destinationisps}',
            '${quote_20_total}',
            '${quote_40_total}',
            '${quote_hc_total}',
            '${buyorsell_fc_baserate}',
            '${buyorsell_fc_sulphursurcharge}',
            '${buyorsell_dc_destinationterminalhandlingcharges}',
            '${buyorsell_oc_exportservicecharge}',
            '${buyorsell_oc_destinationterminalhandlingcharges}'
            )
    `;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send("Data inserted");
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const updateQuotationCompanyDetails = async (req, res) => {
    const id = req.params.id;
    let {
        company_name,
        company_logo,
        quotation_number,
        valid_from,
        valid_to,
        contract_number,
        port_of_loading,
        port_of_discharge,
        quote_20_oceanfreight,
        quote_40_oceanfreight,
        quote_hc_oceanfreight,
        quote_20_bunkeradjustmentfactor,
        quote_40_bunkeradjustmentfactor,
        quote_hc_bunkeradjustmentfactor,
        quote_oc_20_originterminalhandlingcharges,
        quote_oc_40_originterminalhandlingcharges,
        quote_oc_hc_originterminalhandlingcharges,
        quote_oc_20_originisps,
        quote_oc_40_originisps,
        quote_oc_hc_originisps,
        quote_oc_20_sealfee,
        quote_oc_40_sealfee,
        quote_oc_hc_sealfee,
        quote_dc_20_destinationterminalhandlingcharges,
        quote_dc_40_destinationterminalhandlingcharges,
        quote_dc_hc_destinationterminalhandlingcharges,
        quote_dc_20_destinationisps,
        quote_dc_40_destinationisps,
        quote_dc_hc_destinationisps,
        quote_20_total,
        quote_40_total,
        quote_hc_total,
        buyorsell_fc_baserate,
        buyorsell_fc_sulphursurcharge,
        buyorsell_dc_destinationterminalhandlingcharges,
        buyorsell_oc_exportservicecharge,
        buyorsell_oc_destinationterminalhandlingcharges,
        add_charges,
        add_margin,
    } = req.body;

    add_charges = JSON.stringify(add_charges);
    add_margin = JSON.stringify(add_margin);
    const query = `
        UPDATE quotation_company_details SET             
            company_name='${company_name}',
            company_logo='${company_logo}',
            quotation_number='${quotation_number}',
            valid_from='${valid_from}',
            valid_to='${valid_to}',
            contract_number='${contract_number}',
            port_of_loading='${port_of_loading}',
            port_of_discharge='${port_of_discharge}',
            quote_20_oceanfreight='${quote_20_oceanfreight}',
            quote_40_oceanfreight='${quote_40_oceanfreight}',
            quote_hc_oceanfreight='${quote_hc_oceanfreight}',
            quote_20_bunkeradjustmentfactor='${quote_20_bunkeradjustmentfactor}',
            quote_40_bunkeradjustmentfactor='${quote_40_bunkeradjustmentfactor}',
            quote_hc_bunkeradjustmentfactor='${quote_hc_bunkeradjustmentfactor}',
            quote_oc_20_originterminalhandlingcharges='${quote_oc_20_originterminalhandlingcharges}',
            quote_oc_40_originterminalhandlingcharges='${quote_oc_40_originterminalhandlingcharges}',
            quote_oc_hc_originterminalhandlingcharges='${quote_oc_hc_originterminalhandlingcharges}',
            quote_oc_20_originisps='${quote_oc_20_originisps}',
            quote_oc_40_originisps='${quote_oc_40_originisps}',
            quote_oc_hc_originisps='${quote_oc_hc_originisps}',
            quote_oc_20_sealfee='${quote_oc_20_sealfee}',
            quote_oc_40_sealfee='${quote_oc_40_sealfee}',
            quote_oc_hc_sealfee='${quote_oc_hc_sealfee}',
            quote_dc_20_destinationterminalhandlingcharges='${quote_dc_20_destinationterminalhandlingcharges}',
            quote_dc_40_destinationterminalhandlingcharges='${quote_dc_40_destinationterminalhandlingcharges}',
            quote_dc_hc_destinationterminalhandlingcharges='${quote_dc_hc_destinationterminalhandlingcharges}',
            quote_dc_20_destinationisps='${quote_dc_20_destinationisps}',
            quote_dc_40_destinationisps='${quote_dc_40_destinationisps}',
            quote_dc_hc_destinationisps='${quote_dc_hc_destinationisps}',
            quote_20_total='${quote_20_total}',
            quote_40_total='${quote_40_total}',
            quote_hc_total='${quote_hc_total}',
            buyorsell_fc_baserate='${buyorsell_fc_baserate}',
            buyorsell_fc_sulphursurcharge='${buyorsell_fc_sulphursurcharge}',
            buyorsell_dc_destinationterminalhandlingcharges='${buyorsell_dc_destinationterminalhandlingcharges}',
            buyorsell_oc_exportservicecharge='${buyorsell_oc_exportservicecharge}',
            buyorsell_oc_destinationterminalhandlingcharges='${buyorsell_oc_destinationterminalhandlingcharges}',
            add_margin='${add_margin}',
            add_charges='${add_charges}'
            WHERE id=${id}
    `;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send("Data updated");
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};
const getExcelSheetTable = async (req, res) => {
    const query = "SELECT * FROM automation_excel_to_json";
    return executeQuery(query, req.dbConnectionString).then((data) => {
        const newData = data.rows;
        res
            .status(OK)
            .send({ message: "Uploaded successfully inserted pjha.", newData });
    });
};

const getExcelSheetTableCronJob = async (req, res) => {
    const pageSize = req.query.pageSize || 10;
    const pageNumber = req.query.pageNumber || 1;
    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;
    try {
        const query = `
        SELECT doc_id, doc_name, status, details, created_on, updated_on
        FROM quotation_rate_excel_sync
        ORDER BY created_on DESC 
        LIMIT ${limit} OFFSET ${offset};
    `;
        const countQuery = "SELECT COUNT(*) FROM quotation_rate_excel_sync";
        const totalCount = await executeQuery(countQuery, req.dbConnectionString);
        if (!totalCount.rows || !totalCount.rows[0]) {
            console.log("ERROR in totalCount --- ", totalCount, req.dbConnectionString);
        }
        const totalRecords = parseInt(totalCount.rows[0].count);
        const data = await executeQuery(query, req.dbConnectionString);
        res.status(200).send({
            data: data.rows,
            currentPage: pageNumber,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            totalRecords: totalRecords,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
};


const getRateWithBasicCharges = (row, charges) => {
    const originalRow = JSON.parse(JSON.stringify(row));
    let basicCharges = [], otherCharges = [], basicFreightCharge = {};
    for (let i = 0; i < charges.length; i++) {
        const charge = charges[i];
        if (charge.mandatory?.toUpperCase() == "OCEAN FREIGHT") {
            if (["BASIC OCEAN FREIGHT", "SEA FREIGHT (FRT)", "OCEAN FREIGHT", "NET FREIGHT"].includes(charge.chargeName?.toUpperCase())) {
                basicFreightCharge = {
                    ...charge,
                    tariff20: String(originalRow.tariff20?.toFixed(2)),
                    tariff40: String(originalRow.tariff40?.toFixed(2)),
                    tariff40hc: String(originalRow.tariff40hc?.toFixed(2)),
                    tariff45: String(originalRow.tariff45?.toFixed(2)),
                    tariff20Dollar: originalRow.tariff20Dollar,
                    tariff40Dollar: originalRow.tariff40Dollar,
                    tariff40hcDollar: originalRow.tariff40hcDollar,
                    tariff45Dollar: originalRow.tariff45Dollar,
                }
                basicFreightCharge;
            } else {
                basicCharges.push(charge);
                row.tariff20 += getIfNumber(charge.tariff20);
                row.tariff20Dollar += getIfNumber(charge.tariff20Dollar);
                row.tariff40 += getIfNumber(charge.tariff40);
                row.tariff40Dollar += getIfNumber(charge.tariff40Dollar);
                row.tariff40hc += getIfNumber(charge.tariff40hc);
                row.tariff40hcDollar += getIfNumber(charge.tariff40hcDollar);
                row.tariff45 += getIfNumber(charge.tariff45);
                row.tariff45Dollar += getIfNumber(charge.tariff45Dollar);
            }
        } else {
            otherCharges.push(charge);
        }
    }
    row.charges.localChargesList = [...basicCharges, ...otherCharges, basicFreightCharge];
    return row;
}

const searchQuotationRates = async (req, res) => {
    const {
        origin, destination, contractType, cargoReadyDate,
        incoterms, rateType, carrier, type,
        tariff20, tariff40, tariff40hc, tariff45 } = req.body;

    const authUserId = req.user.id;
    const contractTypeArray = contractType.split("/");
    let contractTypeQuery = "";
    let onlineResponse = null;
    let contractResponse = null;
    if (contractTypeArray.length === 1) {
        contractTypeQuery = `contract_type='${contractTypeArray[0]}'`;
    } else {
        contractTypeQuery = contractTypeArray.reduce((acc, item) => {
            if (acc === "") {
                acc = `contract_type='${item}'`;
            } else {
                acc = `${acc} OR contract_type='${item}'`;
            }
            return acc;
        }, "");
    }
    const cargoReadyDate2Week = moment(cargoReadyDate, "MM/DD/YYYY").add(14, 'days').format('MM/DD/YYYY');

    const carrierQueryForContractRates = carrier ? ` AND carrier IN ('${carrier}') ` : ' ';

    const contractRatesFilter = `
    WHERE quotation_rate_output_id IN (
            SELECT MAX(quotation_rate_output_id)
            FROM quotation_rate_output
            WHERE
                origin = '${origin}'
                AND destination = '${destination}'
                AND (${contractTypeQuery})
                ${carrierQueryForContractRates}   
                AND (
                (validity_date_from::date <= '${cargoReadyDate}' AND
                validity_date_to::date >= '${cargoReadyDate}')
                OR
                (validity_date_from::date <= '${cargoReadyDate2Week}' AND
                validity_date_to::date >= '${cargoReadyDate2Week}')
                )
            GROUP BY carrier, via, validity_date_from, validity_date_to
            )`;
    const query = `SELECT * FROM quotation_rate_output ${contractRatesFilter};`;

    if (rateType.online == "online" || rateType.contract == "contract") {
        try {
            const currenciesMap = await getAllCurrenciesMap(req.dbConnectionString);
            if (rateType.online == "online") {
                const spotRates = await getRealtimeSpotRates(req.dbConnectionString, origin, destination, { tariff20, tariff40, tariff40hc, tariff45 });
                const quoteData = await Promise.all(
                    spotRates?.map(async (row) => {
                        /*
                        const allocationQuery = `
                        SELECT a.id, a.total_allocated_space, apc.actual_allocated_space FROM
                          (SELECT ap.id, ap.total_allocated_space FROM
                          allocation_planning ap INNER JOIN (SELECT * FROM online_rates WHERE online_rate_id = ${row.online_rate_id}) qro
                          ON
                            ap.origin ILIKE qro.etd
                            AND ap.destination ILIKE qro.eta
                            AND ap.carrier = qro.pol_code
                            AND ('${cargoReadyDate}' BETWEEN ap.start_date AND ap.end_date)
                          LIMIT 1) a
                        INNER JOIN
                          (SELECT allocation_planning_id, SUM(teu) actual_allocated_space FROM allocation_per_customer GROUP BY allocation_planning_id) apc
                        ON apc.allocation_planning_id = a.id
                        `;
                        const allocationQueryResponse = await executeQuery(
                            allocationQuery,
                            req.dbConnectionString
                        );
                        let allocationSummary;
                        if (
                            allocationQueryResponse?.rows?.length > 0 &&
                            allocationQueryResponse?.rows[0]
                        ) {
                            const allocationSummaryRow = allocationQueryResponse?.rows[0];
                            allocationSummary = {
                                allocationId: allocationSummaryRow.id,
                                actualAllocatedSpace:
                                    allocationSummaryRow.actual_allocated_space,
                                totalAllocatedSpace: allocationSummaryRow.total_allocated_space,
                            };
                        }
                        */
                        const allocationSummary = {
                            allocationId: 0,
                            actualAllocatedSpace: 0,
                            totalAllocatedSpace: 0
                        }
                        const exchangeRate = row.currency ? currenciesMap[row.currency] : 1;
                        if (!exchangeRate) {
                            throw Error("Currency exchange rate not found for currency " + row.currency + ". Connect with System Administrator for further details.");
                        }

                        const charges = await getLocalAndExtraLocalCharges(authUserId, req.dbConnectionString, origin, destination, cargoReadyDate, row.carrier, true, row.etd, row.eta, null);

                        row = {
                            ...row,
                            tariff20Dollar: row.tariff20 * exchangeRate,
                            tariff40Dollar: row.tariff40 * exchangeRate,
                            tariff40hcDollar: row.tariff40hc * exchangeRate,
                            allocationSummary,
                            contractOwner: "Online",
                            charges
                        };
                        row = getRateWithBasicCharges(row, charges?.localChargesList || [], exchangeRate);
                        return row;
                    })
                );
                onlineResponse = { data: { quoteData, scheduleTrips: SCHEDULE_TRIP_LIST }, request: req.body };
            }
            if (rateType.contract == "contract") {
                const queryResponse = await executeQuery(query, req.dbConnectionString);
                const quoteData = await Promise.all(
                    queryResponse.rows?.filter(row => {
                        return (
                            Number(tariff20) * Number(row.tariff_20)
                            +
                            Number(tariff40) * Number(row.tariff_40)
                            +
                            Number(tariff40hc) * Number(row.tariff_40hc)
                            +
                            Number(tariff45) * Number(row.tariff_45)
                        ) > 0;
                    }).map(async (row) => {
                        /*
                        const allocationQuery = `
                        SELECT a.id, a.total_allocated_space, apc.actual_allocated_space FROM
                          (SELECT ap.id, ap.total_allocated_space FROM
                          allocation_planning ap INNER JOIN (SELECT * FROM online_rates WHERE online_rate_id = ${row.online_rate_id}) qro
                          ON
                            ap.origin ILIKE qro.etd
                            AND ap.destination ILIKE qro.eta
                            AND ap.carrier = qro.pol_code
                            AND ('${cargoReadyDate}' BETWEEN ap.start_date AND ap.end_date)
                          LIMIT 1) a
                        INNER JOIN
                          (SELECT allocation_planning_id, SUM(teu) actual_allocated_space FROM allocation_per_customer GROUP BY allocation_planning_id) apc
                        ON apc.allocation_planning_id = a.id
                        `;
                        const allocationQueryResponse = await executeQuery(
                            allocationQuery,
                            req.dbConnectionString
                        );
                        let allocationSummary;
                        if (
                            allocationQueryResponse?.rows?.length > 0 &&
                            allocationQueryResponse?.rows[0]
                        ) {
                            const allocationSummaryRow = allocationQueryResponse?.rows[0];
                            allocationSummary = {
                                allocationId: allocationSummaryRow.id,
                                actualAllocatedSpace:
                                    allocationSummaryRow.actual_allocated_space,
                                totalAllocatedSpace: allocationSummaryRow.total_allocated_space,
                            };
                        }
                        */
                        const allocationSummary = {
                            allocationId: 0,
                            actualAllocatedSpace: 0,
                            totalAllocatedSpace: 0
                        }

                        const exchangeRate = row.currency ? currenciesMap[row.currency] : 1;
                        if (!exchangeRate) {
                            throw Error("Currency exchange rate not found for currency " + row.currency + ". Connect with System Administrator for further details.");
                        }

                        const charges = await getLocalAndExtraLocalCharges(authUserId, req.dbConnectionString, origin, destination, cargoReadyDate, row.carrier, false, null, null, row.contract_number);

                        row = {
                            id: row.quotation_rate_output_id,
                            contractType: row.contract_type,
                            carrier: row.carrier,
                            contractNumber: row.contract_number,
                            validityDateFrom: row.validity_date_from,
                            validityDateTo: row.validity_date_to,
                            origin: row.origin,
                            destination: row.destination,
                            tariff20: row.tariff_20,
                            tariff40: row.tariff_40,
                            tariff45: row.tariff_45,
                            tariff40hc: row.tariff_40hc,
                            tariff20Dollar: row.tariff_20 * exchangeRate,
                            tariff40Dollar: row.tariff_40 * exchangeRate,
                            tariff45Dollar: row.tariff_45 * exchangeRate,
                            tariff40hcDollar: row.tariff_40hc * exchangeRate,
                            allocationSummary,
                            via: row.via,
                            contractOwner: row.contract_owner,
                            vesselName: row.vessel,
                            voyageNumber: row.voyage_number,
                            routeCode: row.route_code,
                            charges
                        };
                        row = getRateWithBasicCharges(row, charges?.localChargesList || [], exchangeRate);
                        return row;
                    })
                );
                const ratesInBuckets = quoteData.reduce((acc, rate) => {
                    if (rate?.contractOwner?.toLowerCase() === "luina lines") {
                        acc.luina.push(rate);
                    } else {
                        acc.nonLuina.push(rate);
                    }
                    return acc;
                }, { luina: [], nonLuina: [] });

                contractResponse = {
                    data: {
                        quoteData: [
                            ...ratesInBuckets.luina,
                            ...ratesInBuckets.nonLuina
                        ], scheduleTrips: SCHEDULE_TRIP_LIST
                    }, request: req.body
                };
            }

            if (onlineResponse && contractResponse) {
                const quoteData = [...contractResponse.data.quoteData, ...onlineResponse.data.quoteData]
                const data = { quoteData, scheduleTrips: onlineResponse.data.scheduleTrips }
                res.status(OK).send({ data: data, request: req.body });
            } else if (contractResponse) {
                res.status(OK).send(contractResponse);
            } else if (onlineResponse) {
                res.status(OK).send(onlineResponse);
            } else {
                res.status(404).json({ error: 'No response data found' });
            }

        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send({ message: error });
        }
    } else {
        res.status(400).json({ error: 'Invalid rateType' });
    }
};

const sendMailNotificationForNoRates = async (req, res) => {
    try {
        const result = req.body;
        const emailAdmin = process.env.NO_RATES_ALERT_EMAILS //added email
        const mailAdminBodyHTML = noRatesAdminTemplate(result);
        await sendMail(
            [emailAdmin],
            "Kuulie | Quotation Not Found",
            mailAdminBodyHTML,
            "",
        );
        res.status(OK).send({ message: "Send no quotation email successfully." });

    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || "Error while sending no quote email." });
    }
};

const getContractNumbers = async (req, res) => {
    const query = "SELECT DISTINCT contract_number FROM quotation_rate_output";
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows?.map((row) => row.contract_number) || [];
            res.status(OK).send({ data });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getDemurrageAndDetention = async (req, res) => {
    const { carrier, origin, destination, eta, etd, online, validityDateFrom, validityDateTo, cargoReadyDate } = req.body;
    let query = "";
    if (online) {
        query = `SELECT * FROM demurrage_and_detention_v3 WHERE carrier = '${carrier}' AND origin = '${origin}' 
  AND destination = '${destination}' AND eta = '${eta}' AND etd = '${etd}';`;
    } else {
        query = `
        SELECT
            DISTINCT
                origin, destination, via,
                carrier, direction, charge_type, name,
                commodity, freetime_start_event, start_day, end_day,
                currency, MAX(cost_per_day_20gp) cost_per_day_20gp, MAX(cost_per_day_40gp) cost_per_day_40gp, MAX(cost_per_day_40hc) cost_per_day_40hc, MAX(cost_per_day_45gp) cost_per_day_45gp
        FROM demurrage_and_detention_v3
        WHERE
            carrier = '${carrier}'
            AND origin = '${origin}'
            AND destination = '${destination}'
            AND etd >= '${getPgSQLFormattedDate(cargoReadyDate)}'
            AND etd <= '${getPgSQLFormattedDate(validityDateTo)}'
        GROUP BY origin, destination, via,
                carrier, direction, charge_type, name,
                commodity, freetime_start_event, start_day, end_day,
                currency;`;
    }
    console.log("getDemurrageAndDetention Query => ", query);
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows || [];
            res.status(OK).send({ data });
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || err });
    }
};



const addMyQuotation = async (req, res) => {
    const authUserId = req.user.id;
    const {
        quotationRateOutputId,
        customerId,
        storeDate,
        commodity,
        weight,
        type_of_margin,
        sur_charges,
        margin,
        chargesTariff20Sum,
        chargesTariff40Sum,
        chargesTariff40hcSum,
        tier1_margin,
        tier2_margin,
        tier3_margin,
        eta,
        etd,
        transitTime
    } = req.body;
    try {
        if (!quotationRateOutputId) {
            return res
                .status(BAD_REQUEST)
                .send({ message: "quotationRateOutputId is required." });
        }
        if (!customerId) {
            return res
                .status(BAD_REQUEST)
                .send({ message: "customerId is required." });
        }
        const currentDateTimestamp = moment(new Date()).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(
            getUserByAuthUserId,
            req.dbConnectionString
        );
        const user =
            userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        if (user && user.user_id) {
            const query = `
        INSERT INTO my_quotations("quotation_rate_output_id","state","customer_id","created_on","created_by","updated_on","updated_by","store_date","commodity","weight","tariff20_charges_sum","tariff40_charges_sum","tariff40hc_charges_sum", "type_of_margin", "sur_charges", "margin","tier1_margin","tier2_margin","tier3_margin","eta", "etd", "transit_time")
        VALUES ('${quotationRateOutputId}','OPEN', ${customerId}, '${currentDateTimestamp}', '${user.user_id}', NULL, NULL, '${storeDate}', '${commodity}', '${weight}', '${chargesTariff20Sum}', '${chargesTariff40Sum}', '${chargesTariff40hcSum}', '${type_of_margin}', '${sur_charges}', '${margin}','${tier1_margin}','${tier2_margin}','${tier3_margin}', '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}', '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}', '${transitTime}')
        RETURNING id
        `;

            const myQuotationAddQueryResponse = await executeQuery(
                query,
                req.dbConnectionString
            );
            if (
                myQuotationAddQueryResponse &&
                myQuotationAddQueryResponse.rowCount > 0
            ) {
                return res.send(myQuotationAddQueryResponse.rows[0]);
            }
        }
        return res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: "Error while adding my quotation." });
    } catch (error) {
        console.log(error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: error.message || error });
    }
};

const updateMyQuotation = async (req, res) => {
    const authUserId = req.user.id;
    const { state } = req.body;
    const id = req.params.id;
    try {
        if (!state) {
            return res.status(BAD_REQUEST).send({ message: "state is required." });
        }
        const currentDateTimestamp = moment(new Date()).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(
            getUserByAuthUserId,
            req.dbConnectionString
        );
        const user =
            userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        if (user && user.user_id) {
            const query = `UPDATE my_quotations 
                        set 
                        "state" = '${state}',
                        "updated_by" = '${user.user_id}',
                        "updated_on" = '${currentDateTimestamp}'
                        where id = ${id}`;
            const myQuotationUpdateQueryResponse = await executeQuery(
                query,
                req.dbConnectionString
            );
            if (
                myQuotationUpdateQueryResponse &&
                myQuotationUpdateQueryResponse.rowCount > 0
            ) {
                const userName = user.first_name + " " + user.last_name;
                addNotificationAndEmit(
                    req.io,
                    req.dbConnectionString,
                    user.user_id,
                    authUserId,
                    "Quotations",
                    "ALL",
                    `${userName} updated status of my quotation to ${state}`,
                    ""
                );
                return res.send({});
            }
        }
        return res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: "Error while updating my quotation." });
    } catch (error) {
        console.log(error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: error.message || error });
    }
};

const getMyQuotations = async (req, res) => {
    const query =
        "SELECT * FROM my_quotations as l INNER JOIN quotation_rate_output as r ON l.quotation_rate_output_id = r.quotation_rate_output_id;";
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data =
                queryResponse.rows?.map((row) => ({
                    id: row.id,
                    contractType: row.contract_type,
                    carrier: row.carrier,
                    contractNumber: row.contract_number,
                    validityDateFrom: row.validity_date_from,
                    validityDateTo: row.validity_date_to,
                    origin: row.origin,
                    destination: row.destination,
                    tariff20: row.tariff_20,
                    tariff40: row.tariff_40,
                    tariff40hc: row.tariff_40hc,
                    chargesTariff20Sum: row.tariff20_charges_sum,
                    chargesTariff40Sum: row.tariff40_charges_sum,
                    chargesTariff40hcSum: row.tariff40hc_charges_sum,
                    state: row.state,
                    createdOn: row.created_on,
                    createdBy: row.created_by,
                    updatedOn: row.updated_on,
                    updatedBy: row.updated_by,
                    cargoReadyDate: row.cargo_ready_date,
                    incoterms: row.incoterms,
                    storeDate: row.store_date,
                    commodity: row.commodity,
                    weight: row.weight,
                    tariff20Count: row.tariff20,
                    tariff40Count: row.tariff40,
                    tariff40hcCount: row.tarrif40hc,
                    customerId: row.customer_id,
                    type_of_margin: row.type_of_margin,
                    sur_charges: row.sur_charges,
                    margin: row.margin,
                    myQuotationId: row.my_quotation_id,
                })) || [];
            res.status(OK).send({ data });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getMyQuotationsByLoggedInUser = async (req, res) => {
    const authUserId = req.user.id;
    try {
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(
            getUserByAuthUserId,
            req.dbConnectionString
        );
        const user =
            userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        if (!user || !user.user_id) {
            return res
                .status(INTERNAL_SERVER_ERROR)
                .send({
                    message:
                        "Error while fetching my quotations created by logged-in user.",
                });
        }
        const query = `SELECT * FROM my_quotations as l INNER JOIN quotation_rate_output as r 
                  ON l.quotation_rate_output_id = r.quotation_rate_output_id
                  AND created_by = '${user.user_id}' ORDER BY my_quotation_id DESC
                  ;`;
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data =
                queryResponse.rows?.map((row) => ({
                    id: row.id,
                    contractType: row.contract_type,
                    carrier: row.carrier,
                    contractNumber: row.contract_number,
                    validityDateFrom: row.validity_date_from,
                    validityDateTo: row.validity_date_to,
                    origin: row.origin,
                    destination: row.destination,
                    tariff20: row.tariff_20,
                    tariff40: row.tariff_40,
                    tariff40hc: row.tariff_40hc,
                    chargesTariff20Sum: row.tariff20_charges_sum,
                    chargesTariff40Sum: row.tariff40_charges_sum,
                    chargesTariff40hcSum: row.tariff40hc_charges_sum,
                    state: row.state,
                    createdOn: row.created_on,
                    createdBy: row.created_by,
                    updatedOn: row.updated_on,
                    updatedBy: row.updated_by,
                    cargoReadyDate: row.cargo_ready_date,
                    incoterms: row.incoterms,
                    storeDate: row.storeDate,
                    commodity: row.commodity,
                    weight: row.weight,
                    tariff20Count: row.tariff20,
                    tariff40Count: row.tariff40,
                    tariff40hcCount: row.tariff40hc,
                    customerId: row.customer_id,
                    type_of_margin: row.type_of_margin,
                    sur_charges: row.sur_charges,
                    margin: row.margin,
                    myQuotationId: row.my_quotation_id,
                    quotationRateOutputId: row.quotation_rate_output_id,
                })) || [];
            res.status(OK).send({ data });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const createPDFAsync = (html, options) =>
    new Promise((resolve, reject) => {
        pdf.create(html, options).toBuffer((err, buffer) => {
            if (err !== null) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });

const getCurrentClientData = async (req) => {
    const currentClientData = await axios.get(
        `${process.env.AUTH_API_URL}/api/my/client`,
        { headers: { Authorization: req.headers.authorization } }
    );
    return currentClientData?.data;
};

const getStringValue = value => value ? `'${value}'` : "''";
const getDateValue = value => value ? `'${value}'` : "NULL";
const getStringValueOrNULL = value => value ? `'${value}'` : "NULL";

const getOnlineRateInsertQuery = (quotation, currentDateTimestamp) => {
    const {
        id, origin, destination, via, carrier,
        tariff20Dollar, tariff40Dollar, tariff40hcDollar,
        transitTime, etd, eta,
        vesselName, voyageNumber, routeCode,
    } = quotation;
    const query = `
    INSERT INTO online_rates(
        online_rate_id,
        pol_code, pol_name,
        pod_code, pod_name,
        via_way_name, carrier_code,
        tariff_20gp, tariff_40gp, tariff_40hc,
        frequency, transport_day, etd, eta,
        vessel_name, voyage, route_code,
        created_on, created_by, updated_on, updated_by)
        VALUES (
        '${id}',
        ${getStringValue(origin)}, ${getStringValue(origin)},
        ${getStringValue(destination)}, ${getStringValue(destination)},
        ${getStringValue(via)}, ${getStringValue(carrier)},
        ${tariff20Dollar}, ${tariff40Dollar}, ${tariff40hcDollar},
        0, ${transitTime}, ${getDateValue(etd)}, ${getDateValue(eta)},
        ${getStringValue(vesselName)}, ${getStringValue(voyageNumber)}, ${getStringValue(routeCode)},
        ${getStringValue(currentDateTimestamp)}, 'ONLINE_QUOTE', NULL, NULL)
    ON CONFLICT(online_rate_id) DO NOTHING;
    SELECT * FROM online_rates WHERE online_rate_id = '${id}';`
    return query;
}

const generatePDFAndShare = async (req, res, successCallback) => {
    const authUserId = req.user.id;
    const {
        quotationRateOutputId,
        online,
        customerId,
        cargoReadyDate,
        incoterms,
        storeDate,
        commodity,
        weight,
        tariff20,
        tariff40,
        tariff40hc,
        chargesTariff20Sum,
        chargesTariff40Sum,
        chargesTariff40hcSum,
        type_of_margin,
        sur_charges,
        margin,
        totalAmount,
        additional_charges_20,
        additional_charges_40,
        additional_charges_40HC,
        tier1_margin,
        tier2_margin,
        tier3_margin,
        eta,
        etd,
        transitTime,
        weight_20,
        weight_40,
        weight_hc,
        customerForSearchQuote,
        selectedCharges,
        quotation: quotationRequestData
    } = req.body;
    if (!quotationRateOutputId) {
        return res
            .status(BAD_REQUEST)
            .send({ message: "quotationRateOutputId is required." });
    }
    if (!customerId) {
        return res.status(BAD_REQUEST).send({ message: "customerId is required." });
    }
    if (!cargoReadyDate) {
        return res
            .status(BAD_REQUEST)
            .send({ message: "cargoReadyDate is required." });
    }
    if (!incoterms) {
        return res.status(BAD_REQUEST).send({ message: "incoterms is required" });
    }
    const options = { format: "a4" };

    const query = `select * from customer_details where customer_id=${customerId}`;
    const customerQueryResponse = await executeQuery(
        query,
        req.dbConnectionString
    );
    if (
        !customerQueryResponse ||
        !customerQueryResponse.rows ||
        customerQueryResponse.rows.length === 0
    ) {
        return res.status(BAD_REQUEST).send({ message: "customerId is invalid." });
    }
    const customer = customerQueryResponse.rows[0];
    if (!customer) {
        return res.status(BAD_REQUEST).send({ message: "customerId is invalid." });
    }

    const currentDateTimestamp = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(
        getUserByAuthUserId,
        req.dbConnectionString,
    );
    let user =
        userQueryResponse?.rows?.length > 0 ? userQueryResponse?.rows[0] : null;

    if (!user && customerForSearchQuote) {
        user = {
            user_id: customerForSearchQuote.customer_id,
        }
    }
    const currenciesMap = await getAllCurrenciesMap(req.dbConnectionString);
    const onlineRate = online;

    if (user && user.user_id) {
        let query = "";
        if (onlineRate) {
            query = getOnlineRateInsertQuery(quotationRequestData, currentDateTimestamp);
        } else {
            query = `SELECT * FROM quotation_rate_output WHERE quotation_rate_output_id = ${quotationRateOutputId}`;
        }
        // const onlineQuery = getOnlineRateInsertQuery(quotationRequestData, currentDateTimestamp) // `SELECT * FROM online_rates WHERE online_rate_id = '${quotationRateOutputId}'`;
        // const quotationQuery = `SELECT * FROM quotation_rate_output WHERE quotation_rate_output_id = ${quotationRateOutputId}`;
        // const query = onlineRate ? onlineQuery : quotationQuery
        let quotationQueryResponse = await executeQuery(
            query,
            req.dbConnectionString,
        );

        if (Array.isArray(quotationQueryResponse)) {
            quotationQueryResponse = quotationQueryResponse[1];
        }

        if (
            !quotationQueryResponse ||
            !quotationQueryResponse.rows ||
            !quotationQueryResponse.rows[0]

        ) {
            return res
                .status(BAD_REQUEST)
                .send({ message: "quotationRateOutputId is invalid." });

        }
        const quotation = quotationQueryResponse.rows[0];
        const origin = quotation.origin || quotation.pod_name;

        const destination = quotation.destination || quotation.pod_name;
        const charges = JSON.stringify(selectedCharges || {});

        const myQuotationAddQuery = `
      INSERT INTO my_quotations("quotation_rate_output_id","state","customer_id","tariff20_charges_sum","tariff40_charges_sum","tariff40hc_charges_sum","created_on","created_by","updated_on","updated_by", "tariff20", "tariff40", "tariff40hc", "cargo_ready_date","incoterms","store_date","commodity","weight", "type_of_margin", "sur_charges", "margin", "additional_charges_20", "additional_charges_40", "additional_charges_40hc","total_amount","tier1_margin","tier2_margin","tier3_margin","eta", "etd", "transit_time","weight_20","weight_40","weight_hc", "charges")
      VALUES ('${quotationRateOutputId}','OPEN', '${customerId}', '${chargesTariff20Sum ? chargesTariff20Sum : 0
            }','${chargesTariff40Sum ? chargesTariff40Sum : 0}','${chargesTariff40hcSum ? chargesTariff40hcSum : 0
            }', '${currentDateTimestamp}', '${user.user_id
            }', NULL, NULL, '${tariff20}', '${tariff40}', '${tariff40hc}', '${moment(
                cargoReadyDate
            ).format("YYYY-MM-DD HH:mm:ss")}', '${incoterms}', '${moment(
                storeDate
            ).format(
                "YYYY-MM-DD HH:mm:ss"
            )}', '${commodity}','${weight}', '${type_of_margin}', '${sur_charges}','${margin}', '${additional_charges_20 || 0}', '${additional_charges_40 || 0}', '${additional_charges_40HC || 0}','${totalAmount}','${tier1_margin || 0}','${tier2_margin || 0}','${tier3_margin || 0}',
      '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}', 
      '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',
      '${transitTime}' , '${weight_20}','${weight_40}','${weight_hc}', '${charges}') RETURNING * `;
        const myQuotationAddQueryResponse = await executeQuery(
            myQuotationAddQuery,
            req.dbConnectionString
        );
        if (
            myQuotationAddQueryResponse &&
            myQuotationAddQueryResponse.rows &&
            myQuotationAddQueryResponse.rows[0]
        ) {
            const myQuotationAddExtraChargesQuery = `INSERT INTO my_quotations_extra_local_charges 
      (my_quotations_id, 
        quotation_extra_local_charges_id, origin, destination, charge_type, charge_name, 
        charge_code, currency, tariff_20, tariff_40, tariff_40hc, created_on, created_by, 
        updated_on, updated_by) 
      select '${myQuotationAddQueryResponse.rows[0].id}', 
      quotation_extra_local_charges_id, origin,destination, charge_type, charge_name, 
      charge_code, currency, tariff_20, tariff_40,tariff_40hc, '${currentDateTimestamp}', '${user.user_id}', 
      '${currentDateTimestamp}', '${user.user_id}' from quotation_extra_local_charges where origin ILIKE '${origin}' and destination ILIKE '${destination}' `;
            const myQuotationAddExtraChargesQueryResponse = await executeQuery(
                myQuotationAddExtraChargesQuery,
                req.dbConnectionString
            );
            if (myQuotationAddExtraChargesQueryResponse) {
                const myQuotation = myQuotationAddQueryResponse.rows[0];
                const selectedLocalChargeIds = (selectedCharges?.local || []).join(",");
                const localChargesQuery = `select * from quotation_local_charges where quotation_local_charges_id IN (${selectedLocalChargeIds})`;
                const extraLocalChargesQuery = `select * from my_quotations_extra_local_charges where my_quotations_id = '${myQuotationAddQueryResponse.rows[0].id}'`;

                const localChargesListQueryResult = await executeQuery(
                    localChargesQuery,
                    req.dbConnectionString
                );
                const localCharges = localChargesListQueryResult?.rows || [];

                const extraLocalChargesListQueryResult = await executeQuery(
                    extraLocalChargesQuery,
                    req.dbConnectionString
                );
                const extraLocalCharges = extraLocalChargesListQueryResult?.rows || [];

                const clientData = await getCurrentClientData(req);
                const allCharges = [...localCharges, ...extraLocalCharges];

                let originTotal = { tariff20: 0, tariff40: 0, tariff40hc: 0 };
                let destinationTotal = { tariff20: 0, tariff40: 0, tariff40hc: 0 };

                for (let i = 0; i < allCharges?.length; i++) {
                    const charge = allCharges[i];
                    const exchangeRate = charge.currency ? currenciesMap[charge.currency] : 1;

                    if (originChargeTypes.includes(charge?.charge_type?.toLowerCase())) {
                        originTotal.tariff20 = toRoundedFixed(originTotal.tariff20 + parseFloat(charge.tariff_20 * exchangeRate));
                        originTotal.tariff40 = toRoundedFixed(originTotal.tariff40 + parseFloat(charge.tariff_40 * exchangeRate));
                        originTotal.tariff40hc = toRoundedFixed(originTotal.tariff40hc + parseFloat(charge.tariff_40hc * exchangeRate));
                    }

                    if (destinationChargeTypes.includes(charge?.charge_type?.toLowerCase())) {
                        destinationTotal.tariff20 = toRoundedFixed(destinationTotal.tariff20 + parseFloat(charge.tariff_20 * exchangeRate));
                        destinationTotal.tariff40 = toRoundedFixed(destinationTotal.tariff40 + parseFloat(charge.tariff_40 * exchangeRate));
                        destinationTotal.tariff40hc = toRoundedFixed(destinationTotal.tariff40hc + parseFloat(charge.tariff_40hc * exchangeRate));

                    }

                }

                const buffer = await createPDFAsync(
                    getMyQuotationPDFHTML(
                        customer,
                        user,
                        myQuotation,
                        quotation,
                        allCharges,
                        clientData,
                        originTotal,
                        destinationTotal,
                        origin,
                        destination
                    ),

                    options
                );
                await successCallback(buffer, customerId, myQuotation, clientData);
                return;
            }
        }
    }
    return res
        .status(INTERNAL_SERVER_ERROR)
        .send({ message: "Error while sharing my quotation." });
};

const generateMyQuotationPDF = async (req, res) => {
    try {
        await generatePDFAndShare(req, res, async (buffer, customerId, myQuotation, clientData) => {

            const {
                eta, etd, transitTime,
                origin, destination, online,
                tariff20, tariff40, tariff40hc,
                commodity, weight, cargoReadyDate,
                storeDate, hazardous, weight_20,
                weight_40, weight_hc
            } = req.body;

            const authUserId = req.user.id;
            const fileName = `quotation-${myQuotation.id}.pdf`;
            const attachments = [
                // {
                //     filename: fileName,
                //     content: buffer,
                // },
                {
                    filename: "KuulieLogo.png",
                    path: kuulieLogo,
                    cid: "kuulie-logo"
                },
                {
                    filename: "ClientLogo.png",
                    path: clientData?.logo,
                    cid: "client-logo"
                }
            ];
            const currentDateTimestamp = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
            const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

            const query = `INSERT INTO "quotation_requests"
                (customer_id, origin, destination,
                    tariff_20, tariff_40, tariff_40hc,
                        commodity, weight, cargo_ready_date, store_date,
                        hazardous, status, my_quotation_id,
                        created_on, created_by, updated_on, updated_by,type, eta, etd, transit_time,
                        weight_20, weight_40, weight_hc, shared_with)
                VALUES ('${customerId}', '${origin}', '${destination}', '${tariff20}'
            , '${tariff40}', '${tariff40hc}', '${commodity}', '${weight || 0}',
            '${cargoReadyDate}', '${storeDate}', '${hazardous || false}'
            , 'SENT', ${myQuotation.id}, '${currentDateTimestamp}', '${user.user_id}',
            '${currentDateTimestamp}', '${user.user_id}','CUSTOMER_REQUEST',
            '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}',
            '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',
            '${transitTime}' ,'${weight_20}', '${weight_40}', '${weight_hc}', '${authUserId}')
            RETURNING id`;

            const data = await executeQuery(query, req.dbConnectionString);

            if (data && data.rowCount) {
                const quotationRequestId = data.rows[0].id;
                await addQuotationNotification(req, "Quotation Request", customerId, user.user_id, authUserId, `${user.first_name} ${user.last_name} has sent you quotation`, JSON.stringify({}), attachments, user, clientData, quotationRequestId);

                res.setHeader("Content-Length", buffer.length);
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=quotation.pdf"
                );
                return res.status(OK).send(buffer);

            } else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while sending quotation" });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
};

const saveMyQuotation = async (req, res) => {
    try {
        await generatePDFAndShare(req, res, async (buffer, customerId, myQuotation, clientData) => {
            const {
                eta, etd, transitTime,
                origin, destination,
                tariff20, tariff40, tariff40hc,
                commodity, weight, cargoReadyDate,
                storeDate, hazardous, weight_20,
                weight_40, weight_hc
            } = req.body;

            const authUserId = req.user.id;
            const fileName = `quotation-${myQuotation.id}.pdf`;
            const attachments = [
                // {
                //     filename: fileName,
                //     content: buffer,
                // },
                {
                    filename: "KuulieLogo.png",
                    path: kuulieLogo,
                    cid: "kuulie-logo"
                },
                {
                    filename: "ClientLogo.png",
                    path: clientData?.logo,
                    cid: "client-logo"
                }
            ];
            const currentDateTimestamp = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
            const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

            const query = `INSERT INTO "quotation_requests"
                (customer_id, origin, destination,
                    tariff_20, tariff_40, tariff_40hc,
                        commodity, weight, cargo_ready_date, store_date,
                        hazardous, status, my_quotation_id,
                        created_on, created_by, updated_on, updated_by,type, eta, etd, transit_time,
                        weight_20, weight_40, weight_hc, shared_with)
                VALUES ('${customerId}', '${origin}', '${destination}', '${tariff20}'
            , '${tariff40}', '${tariff40hc}', '${commodity}', '${weight || 0}',
            '${cargoReadyDate}', '${storeDate}', '${hazardous || false}'
            , 'SENT', ${myQuotation.id}, '${currentDateTimestamp}', '${user.user_id}',
            '${currentDateTimestamp}', '${user.user_id}','CUSTOMER_REQUEST',
            '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}',
            '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',
            '${transitTime}' ,'${weight_20}', '${weight_40}', '${weight_hc}', '${authUserId}')
            RETURNING id`;

            const data = await executeQuery(query, req.dbConnectionString);

            if (data && data.rowCount) {
                const quotationRequestId = data.rows[0].id;
                await addQuotationNotification(req, "Quotation Request", customerId, user.user_id, authUserId, `${user.first_name} ${user.last_name} has sent you quotation`, JSON.stringify({}), attachments, user, clientData, quotationRequestId);
                res.status(OK).send({ message: `Quotation sent successfully` });
            } else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while sending quotation" });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
};

const addQuotationNotification = async (req, type, customerId, userId, authUserId, message, details, attachments, user, client, quotationRequestId) => {
    const query = `select * from customer_details where customer_id=${customerId}`;
    const customerQueryResponse = await executeQuery(query, req.dbConnectionString);
    if (customerQueryResponse && customerQueryResponse.rows && customerQueryResponse.rows.length > 0) {
        const customer = customerQueryResponse.rows[0];
        const customerAuthUserId = customer.auth_user_id;
        await addNotificationAndEmit(req.io, req.dbConnectionString, userId, authUserId, type, `CUSTOMER-${customerAuthUserId}`, message, details);
        const emailId = customer.primary_emailid;
        const quotationLink = `${process.env.CUSTOMER_PORTAL_URL}/quotations/details/${quotationRequestId}`;
        const customerName = `${customer.firstname} ${customer.lastname}`;
        const senderName = `${user.first_name} ${user.last_name}`;
        const senderOrganizationName = client.clientName;
        const mailMessageTitle = type === "Quotation Request" ? "You have received a new quotation." : "You have received a new flash rate.";
        const mailMessageBody = type === "Quotation Request" ? `${senderName} from ${senderOrganizationName} has shared the most updated rate as per your request.` : `${senderName} from ${senderOrganizationName} has shared the most updated flash rate.`;
        const mailBodyHTML = getQuotationTemplate(quotationLink, customerName, mailMessageTitle, mailMessageBody);
        await sendMail(emailId, `Kuulie | ${type}`, mailBodyHTML, '', attachments);
    }
}

const shareMyQuotation = async (req, res) => {
    try {
        await generatePDFAndShare(req, res, async (buffer, customerId, myQuotation, clientData) => {
            const { quotationRequestId, eta, etd, transitTime } = req.body;
            const authUserId = req.user.id;
            const fileName = `quotation-${myQuotation.id}.pdf`;
            const attachments = [
                // {
                //   filename: fileName,
                //   content: buffer,
                // },
                {
                    filename: "KuulieLogo.png",
                    path: kuulieLogo,
                    cid: "kuulie-logo"
                },
                {
                    filename: "ClientLogo.png",
                    path: clientData?.logo,
                    cid: "client-logo"
                }
            ];
            const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
            const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
            const query = `UPDATE "quotation_requests" 
      SET status ='SENT',
      my_quotation_id = ${myQuotation.id},
      eta = '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}',
      etd = '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',
      transit_time = '${transitTime}',
      updated_on='${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}',
      updated_by='${user.user_id}' WHERE id = '${quotationRequestId}'`;
            const data = await executeQuery(query, req.dbConnectionString);
            if (data && data.rowCount) {
                await addQuotationNotification(req, "Quotation Request", customerId, user.user_id, authUserId, `${user.first_name} ${user.last_name} has sent you quotation for your request #${quotationRequestId}`, JSON.stringify({ quotationRequestId }), attachments, user, clientData, quotationRequestId);
                res.status(OK).send({ message: `Quotation request updated successfully` });
            } else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while updating quotation request status" });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
};

const sendFlashRate = async (req, res) => {
    const {
        origin, destination,
        tariff20, tariff40, tariff40hc,
        commodity, weight, cargoReadyDate, storeDate, hazardous,
        customers,
        eta, etd, transitTime,
        tier1_margin,
        tier2_margin,
        tier3_margin,
        weight_20,
        weight_40,
        weight_hc,
        online
    } = req.body;
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

        let result = {
            success: [],
            error: []
        }

        for (let i = 0; i < customers.length; i++) {
            const { customerId, totalAmount } = customers[i];
            const authUserId = req.user.id;
            const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
            const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

            const query = `INSERT INTO "quotation_requests"
          (customer_id, origin, destination,
               tariff_20, tariff_40, tariff_40hc,
                commodity, weight, cargo_ready_date, store_date,
                 hazardous, status,
                  created_on, created_by, updated_on, updated_by,type, eta, etd, transit_time,weight_20, weight_40, weight_hc, shared_with)
          VALUES ('${customerId}', '${origin}', '${destination}', '${tariff20}'
      , '${tariff40}', '${tariff40hc}', '${commodity}', '${weight || 0}', '${cargoReadyDate}', '${storeDate}', '${hazardous}'
      , 'RECEIVED', '${currentDateTimestamp}', '${user.user_id}', '${currentDateTimestamp}', '${user.user_id}','FLASH_RATE','${moment(eta).format("YYYY-MM-DD HH:mm:ss")}', '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}', '${transitTime}' ,'${weight_20}', '${weight_40}', '${weight_hc}', '${authUserId}')
       RETURNING id`;


            const response = await executeQuery(query, req.dbConnectionString);
            if (response?.rows?.length > 0) {
                req.body.customerId = customerId;
                req.body.totalAmount = totalAmount;
                await generatePDFAndShare(req, res, async (buffer, customerId, myQuotation, clientData) => {
                    const fileName = `quotation-${myQuotation.id}.pdf`;
                    const attachments = [
                        // {
                        //   filename: fileName,
                        //   content: buffer,
                        // },
                        {
                            filename: "KuulieLogo.png",
                            path: kuulieLogo,
                            cid: "kuulie-logo"
                        },
                        {
                            filename: "ClientLogo.png",
                            path: clientData?.logo,
                            cid: "client-logo"
                        }
                    ];
                    const quotationRequestId = response?.rows[0].id;

                    const query = `UPDATE "quotation_requests" 
            SET status ='SENT',
            eta = '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}',
            etd = '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',      
            my_quotation_id = ${myQuotation.id},
            updated_on='${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}',
            updated_by='${user.user_id}' WHERE id = '${quotationRequestId}'`;
                    await executeQuery(query, req.dbConnectionString);
                    await addQuotationNotification(req, "Flash Rate", customerId, user.user_id, authUserId, `${user.first_name} ${user.last_name} has sent you new flash rate`, JSON.stringify({ quotationRequestId }), attachments, user, clientData, quotationRequestId);
                });

                result.success.push(customerId);
            } else {
                console.log(response);
                result.error.push(customerId);
            }
        }

        await executeQuery(`UPDATE customer_tier_margin
      SET customer_tier1_margin=${tier1_margin}, customer_tier2_margin=${tier2_margin}, customer_tier3_margin=${tier3_margin};`, req.dbConnectionString);

        if (result.success.length > 0) {
            res.status(OK).send({ message: 'Quotation requested successfully', result });
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while submitting quotation request.", result });
        }
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const confirmSearchQuote = async (req, res) => {
    const { origin, shared_with, destination, carrier, totalAmount, tariff20, tariff40, tariff40hc, commodity, weight, cargoReadyDate, storeDate, hazardous, eta, etd, transitTime, loadType, totalWeight, totalVolume, packageDetails } = req.body;
    const weightToInsert = loadType === 'LCL' ? totalWeight : weight || 0;
    const sharedWithAuthUserIds = shared_with?.map(u => u.authUserId);
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const authUserId = req.user.id;
        const customerQuery = `select * from customer_details where  auth_user_id='${authUserId}'`;
        const customerQueryResponse = await executeQuery(customerQuery, req.dbConnectionString);
        const customer = customerQueryResponse?.rows.length > 0 ? customerQueryResponse?.rows[0] : null;
        const quoteQuery = `select my_quotation_id from my_quotations`;
        const quoteQueryResponse = await executeQuery(quoteQuery, req.dbConnectionString);
        const quotation = quoteQueryResponse?.rows.length > 0 ? quoteQueryResponse?.rows[0] : null;

        if (!customer) {
            res.status(400).json({ message: "Logged in user must be valid customer." });
            return;
        }

        const customerId = customer.customer_id
        const query = `INSERT INTO "quotation_requests"
          (customer_id, origin,shared_with, destination,carrier,total_amount,
               tariff_20, tariff_40, tariff_40hc,
                commodity, weight, cargo_ready_date, store_date,
                 hazardous, status,
                  created_on, created_by, updated_on, updated_by, type, eta, etd, transit_time, "loadType", volume, "packageDetails" )
          VALUES ('${customerId}', '${origin}','${sharedWithAuthUserIds}', '${destination}','${carrier}','${totalAmount}', '${tariff20}'
      , '${tariff40}', '${tariff40hc}', '${commodity}', '${weightToInsert || 0}', '${cargoReadyDate}', '${storeDate}', '${hazardous}'
      , 'ACCEPTED', '${currentDateTimestamp}', '${customerId}', '${currentDateTimestamp}', 
      ${customerId},'SEARCH_QUOTE','${moment(eta).format("YYYY-MM-DD HH:mm:ss")}', '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}', '${transitTime}', '${loadType || "FCL"}', '${totalVolume || 0}', '${JSON.stringify(packageDetails)}')
       RETURNING id`;

        const response = await executeQuery(query, req.dbConnectionString);
        if (response?.rows?.length > 0) {
            req.body.customerId = customerId;
            req.body.totalAmount = totalAmount;
            req.body.customerForSearchQuote = customer;

            await generatePDFAndShare(req, res, async (_buffer, _customerId, myQuotation, _clientData) => {
                const quotationRequestId = response?.rows[0].id;

                const query = `UPDATE "quotation_requests" 
        SET status ='ACCEPTED',
        eta = '${moment(eta).format("YYYY-MM-DD HH:mm:ss")}',
        etd = '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}',      
        my_quotation_id = ${myQuotation.id},
        updated_on='${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}',
        updated_by='${customerId}' WHERE id = '${quotationRequestId}'`;

                await executeQuery(query, req.dbConnectionString);
                res.json({ message: "Quote confirmed successfully." });
                const result = req.body;
                for (const user of shared_with) {
                    const myQuotation = quotation.my_quotation_id
                    const customerName = `${customer.firstname} ${customer.lastname}`;
                    const mailBodyHTML = quoteConfirmTemplate(result, customerName, myQuotation);
                    const attachments = [
                        {
                            filename: "KuulieLogo.png",
                            path: kuulieLogo,
                            cid: "kuulie-logo"
                        },
                        {
                            filename: "ClientLogo.png",
                            path: _clientData?.logo,
                            cid: "client-logo"
                        }
                    ];
                    await sendMail(user.email, `Kuulie | Rate Confirmed`, mailBodyHTML, '', attachments);
                }
                {
                    return res.status(OK).send({});
                }
            });

        } else {
            console.log(response);
        }

        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while confirming quotation." });

    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while confirming quotation." })
    }
}

const sendSearchQuote = async (req, res) => {
    const { origin, shared_with, destination, carrier, totalAmount, tariff20, tariff40, tariff40hc, commodity, weight, cargoReadyDate, storeDate, hazardous, eta, etd, transitTime, loadType, totalWeight, totalVolume, packageDetails } = req.body;
    const weightToInsert = loadType === 'LCL' ? totalWeight : weight || 0;
    const sharedWithAuthUserIds = shared_with?.map(u => u.authUserId);
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const authUserId = req.user.id;
        const customerQuery = `select * from customer_details where  auth_user_id='${authUserId}'`;
        const customerQueryResponse = await executeQuery(customerQuery, req.dbConnectionString);
        const customer = customerQueryResponse?.rows.length > 0 ? customerQueryResponse?.rows[0] : null;
        const quoteQuery = `select my_quotation_id from my_quotations`;
        const quoteQueryResponse = await executeQuery(quoteQuery, req.dbConnectionString);
        const quotation = quoteQueryResponse?.rows.length > 0 ? quoteQueryResponse?.rows[0] : null;

        if (!customer) {
            res.status(400).json({ message: "Logged in user must be valid customer." });
            return;
        }

        const customerId = customer.customer_id
        const query = `INSERT INTO "quotation_requests"
          (customer_id, origin,shared_with, destination,carrier,total_amount,
               tariff_20, tariff_40, tariff_40hc,
                commodity, weight, cargo_ready_date, store_date,
                 hazardous, status,
                  created_on, created_by, updated_on, updated_by, type, eta, etd, transit_time, "loadType", volume, "packageDetails" )
          VALUES ('${customerId}', '${origin}','${sharedWithAuthUserIds}', '${destination}','${carrier}','${totalAmount}', '${tariff20}'
      , '${tariff40}', '${tariff40hc}', '${commodity}', '${weightToInsert || 0}', '${cargoReadyDate}', '${storeDate}', '${hazardous}'
      , 'PENDING_APPROVAL', '${currentDateTimestamp}', '${customerId}', '${currentDateTimestamp}', 
      ${customerId},'SEARCH_QUOTE','${moment(eta).format("YYYY-MM-DD HH:mm:ss")}', '${moment(etd).format("YYYY-MM-DD HH:mm:ss")}', '${transitTime}', '${loadType || "FCL"}', '${totalVolume || 0}', '${JSON.stringify(packageDetails)}')
       RETURNING id`;
        const response = await executeQuery(query, req.dbConnectionString);
        if (response?.rows?.length > 0) {
            req.body.customerId = customerId;
            req.body.totalAmount = totalAmount;
            req.body.customerForSearchQuote = customer;

            await generatePDFAndShare(req, res, async (_buffer, _customerId, myQuotation, _clientData) => {
                const result = req.body;
                const quotationRequestId = response?.rows[0].id;

                const query = `UPDATE "quotation_requests" SET my_quotation_id = ${myQuotation.id} WHERE id = '${quotationRequestId}'`;
                await executeQuery(query, req.dbConnectionString);

                for (const user of shared_with) {
                    const myQuotation = quotation.my_quotation_id
                    const customerName = `${customer.firstname} ${customer.lastname}`;
                    const mailBodyHTML = quotePendingRequestTemplate(result, customerName, myQuotation);
                    const attachments = [
                        {
                            filename: "KuulieLogo.png",
                            path: kuulieLogo,
                            cid: "kuulie-logo"
                        },
                        {
                            filename: "ClientLogo.png",
                            path: _clientData?.logo,
                            cid: "client-logo"
                        }
                    ];
                    await sendMail(user.email, `Kuulie | Quote Request For Approval`, mailBodyHTML, '', attachments);
                }
                {
                    return res.status(OK).send({});
                }
            });

        } else {
            console.log(response);
        }

        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while Requesting quotation." });

    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while Requesting quotation." })
    }
}

const generateAndSendQuotationPDFViaWhatsApp = async (req, res) => {
    try {
        await generatePDFAndShare(req, res, async (buffer, customerId) => {
            const fileName = "quotation.pdf";
            const query = `select * from customer_details where customer_id=${customerId}`;
            const customerQueryResponse = await executeQuery(
                query,
                req.dbConnectionString
            );
            if (
                customerQueryResponse &&
                customerQueryResponse.rows &&
                customerQueryResponse.rows.length > 0
            ) {
                const customer = customerQueryResponse.rows[0];
                const mobileNumber = customer.mobile_number;
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const client = require("twilio")(accountSid, authToken);
                const data = await uploadQuotationDocument(fileName, buffer);
                const message = await client.messages.create({
                    mediaUrl: data.Location,
                    body: "Quotation as per your enquiry.",
                    from: `whatsapp:${process.env.TWILIO_FROM_NUMBER}`,
                    to: `whatsapp:${mobileNumber}`,
                });
                console.log(message);
                return res.status(OK).send(message);
            }
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
};

const generateAndSendQuotationPDFViaMail = async (req, res) => {
    try {
        await generatePDFAndShare(req, res, async (buffer, customerId) => {
            const fileName = "quotation.pdf";
            const query = `select * from customer_details where customer_id=${customerId}`;
            const customerQueryResponse = await executeQuery(
                query,
                req.dbConnectionString
            );
            if (
                customerQueryResponse &&
                customerQueryResponse.rows &&
                customerQueryResponse.rows.length > 0
            ) {
                const customer = customerQueryResponse.rows[0];
                const customerEmailId = customer.primary_emailid;
                const customerName = customer.firstname;
                const mailBodyHTML = `
              Hi ${customerName},<br/>
                <br />
                PFA for Quotation as per your requirement.<br />
                <br />
                <b>
              Thanks and Regards,<br />
              The Kuulie Team
              </b>
            `;
                // const attachments = [
                // {
                //   filename: fileName,
                //   content: buffer,
                // },
                // ];
                const isMailSent = await sendMail(
                    customerEmailId,
                    "Kuulie | Quotation",
                    mailBodyHTML,
                    "",
                    attachments
                );
                if (isMailSent) {
                    return res.status(OK).send({});
                } else {
                    return res
                        .status(INTERNAL_SERVER_ERROR)
                        .send({ message: "Error while sending quotation email" });
                }
            }
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err });
    }
};

const getTierMargins = async (req, res) => {
    try {
        const query = "select * from customer_tier_margin ORDER BY id ASC;";
        const tierMarginqueryResult = await executeQuery(query, req.dbConnectionString);
        const data = tierMarginqueryResult?.rows?.map((row) => ({
            id: row.id,
            tier: row.customer_tier_margin,
            price: row.customer_tier_margin_price,
            membership_fees: row.membership_fees,
            procurement_fees: row.procurement_fees,
            agent_fees: row.agent_fees,
        })) || [];
        res.status(OK).json({ data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Error while getting customer margins" });
    }
}

const getTierMarginsById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `select * from customer_tier_margin where id = ${id}`;
        const tierMarginqueryResult = await executeQuery(query, req.dbConnectionString);
        const data = tierMarginqueryResult?.rows?.map((row) => ({
            id: row.id,
            tier: row.customer_tier_margin,
            price: row.customer_tier_margin_price,
            membership_fees: row.membership_fees,
            procurement_fees: row.procurement_fees,
            agent_fees: row.agent_fees,
        })) || [];
        res.status(OK).json({ data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Error while getting customer margins By Id" });
    }
}

const updateTierMargins = async (req, res) => {
    const { id } = req.params;
    const { tierPrice, membership_fees, procurement_fees, agent_fees } = req.body;
    const authUserId = req.user.id;

    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const selectQuery = `SELECT * FROM customer_tier_margin WHERE id = ${id}`;
        const tierMarginQueryResult = await executeQuery(selectQuery, req.dbConnectionString);
        const existingData = tierMarginQueryResult.rows[0];
        if (!existingData) {
            return res.status(404).json({ message: "Data not found for the given ID" });
        }
        const updateQuery = `UPDATE customer_tier_margin 
                             SET customer_tier_margin_price = ${tierPrice},
                             membership_fees = ${membership_fees},
                             procurement_fees = ${procurement_fees},
                             agent_fees = ${agent_fees},
                             updated_on = '${currentDateTimestamp}',updated_by = '${authUserId}'
                             WHERE id = ${id}`;
        const updatedData = await executeQuery(updateQuery, req.dbConnectionString);
        res.status(OK).json({ message: "Customer Tier Margin updated successfully", data: updatedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || "Error while updating customer margins by ID" });
    }
}

const createTierMargins = async (req, res) => {
    const { tier_margin, tier_margin_price } = req.body;
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const authUserId = req.user.id;

        const query = `INSERT INTO "customer_tier_margin" 
        (customer_tier_margin, customer_tier_margin_price, created_on, created_by, updated_on, updated_by)
         VALUES (
        '${tier_margin}', '${tier_margin_price}', '${currentDateTimestamp}', '${authUserId}',
        '${currentDateTimestamp}', '${authUserId}')`;

        const tierMarginqueryResult = await executeQuery(query, req.dbConnectionString);

        if (tierMarginqueryResult) {
            res.status(OK).json({ message: "Customer margins created successfully" });
        } else {
            res.status(500).json({ message: "Error while creating customer margins" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Error while creating customer margins" });
    }
};

const getLocalAndExtraLocalCharges = async (
    authUserId,
    dbConnectionString,
    origin,
    destination,
    cargoReadyDate,
    carrier,
    online,
    etd,
    eta,
    contractNumber
) => {
    const chargesKey = `CHARGES_${origin}_${destination}_${cargoReadyDate}_${carrier}_${dbConnectionString}_${online}_${etd}_${eta}`;
    let charges = await getCache(chargesKey);
    // if (charges?.localChargesList) {
    //     console.log("Returning charges from cache", chargesKey);
    //     return charges;
    // }
    let localChargesQueryFilter = "";
    if (online) {
        localChargesQueryFilter = ` 
        AND (created_by = 'GEEKYUM_RATE_API' OR type = 'EXTRA')
        AND 
        (
            (validity_date_from::DATE = '${etd}' AND validity_date_to::DATE >= '${eta}')
        )
        `;
    } else {
        const cargoReadyDate2Week = moment(cargoReadyDate, "MM/DD/YYYY").add(14, 'days').format('MM/DD/YYYY');
        localChargesQueryFilter = ` 
        AND created_by != 'GEEKYUM_RATE_API' 
        AND (contract_number = '${contractNumber}')
        AND
        (
            (validity_date_from::DATE <= '${cargoReadyDate}' AND validity_date_to::DATE >= '${cargoReadyDate}')
            OR
            (validity_date_from::DATE <= '${cargoReadyDate2Week}' AND validity_date_to::DATE >= '${cargoReadyDate2Week}')
        ) `;
    }
    const localChargesQuery = `SELECT *
    FROM quotation_local_charges
    WHERE quotation_local_charges_id IN (
            SELECT MAX(quotation_local_charges_id)
            FROM quotation_local_charges
            WHERE origin = '${origin}'
                AND destination = '${destination}'
                ${localChargesQueryFilter}
                AND carrier = '${carrier}'
            GROUP BY charge_name, export_import
            )`;
    console.log("localChargesQuery", localChargesQuery);
    const currenciesMap = await getAllCurrenciesMap(dbConnectionString);
    const localChargesListQueryResult = await executeQuery(
        localChargesQuery,
        dbConnectionString
    );
    const localChargesData = localChargesListQueryResult?.rows?.map((row) => {
        const exchangeRate = currenciesMap[row.currency] || 1;

        if (!exchangeRate) {
            throw Error("Currency exchange rate not found for currency " + row.currency + ". Connect with System Administrator for further details.");
        }
        return {
            id: row.quotation_local_charges_id,
            validityDateFrom: row.validity_date_from,
            validityDateTo: row.validity_date_to,
            origin: row.origin,
            destination: row.destination,
            chargeType: row.charge_type,
            chargeName: row.charge_name,
            chargeCode: row.charge_code,
            currency: row.currency,
            tariff20: row.tariff_20,
            tariff40: row.tariff_40,
            tariff45: row.tariff_45,
            tariff40hc: row.tariff_40hc,
            tariff20Dollar: isNaN(row.tariff_20) ? row.tariff_20 : row.tariff_20 * exchangeRate,
            tariff40Dollar: isNaN(row.tariff_40) ? row.tariff_40 : row.tariff_40 * exchangeRate,
            tariff45Dollar: isNaN(row.tariff_45) ? row.tariff_45 : row.tariff_45 * exchangeRate,
            tariff40hcDollar: isNaN(row.tariff_40hc) ? row.tariff_40hc : row.tariff_40hc * exchangeRate,
            carrier: row.carrier,
            contractNumber: row.contract_number,
            mandatory: row.mandatory_extra?.toUpperCase(),
            exportImport: row.export_import,
            type: row.type
        }
    }) || [];
    const extraLocalChargesData = await getExtraLocalCharges(
        dbConnectionString,
        origin,
        destination,
        authUserId
    );
    charges = {
        localChargesList: localChargesData,
        extraLocalChargesList: extraLocalChargesData
    };
    await setExpirableCache(chargesKey, charges, CHARGE_RATE_CACHE_EXPIRY_TIME);
    return charges;
}

const getChargesByOriginAndDestination = async (req, res) => {
    const { origin, destination, cargoReadyDate, carrier, contractOwner, etd, eta, contractNumber } = req.body;
    const authUserId = req.user.id;
    if (origin && destination && cargoReadyDate) {
        try {
            const { localChargesList, extraLocalChargesList } = await getLocalAndExtraLocalCharges(authUserId, req.dbConnectionString, origin, destination, cargoReadyDate, carrier, contractOwner?.toLowerCase() === 'online', etd, eta, contractNumber);
            res
                .status(OK)
                .send({
                    localChargesList,
                    extraLocalChargesList,
                });
        } catch (err) {
            console.log(err);
            res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message, err });
        }
    } else {
        res
            .status(INTERNAL_SERVER_ERROR)
            .send({
                message: "Please provide Origin, Destination and Cargo ready Date",
            });
    }
};

const insertIntoExtraLocalCharges = async (req, res) => {
    const {
        origin,
        destination,
        charge_type,
        charge_name,
        charge_code,
        currency,
        tariff_20,
        tariff_40,
        tariff_40hc,
        carrier,
        export_import,
        remarks,
        mandatory_extra,
        tariff_45,
        deleted,
        via,
        contract_number,
        online,
        etd,
        eta
    } = req.body;
    const authUserId = req.user.id;
    if (
        origin &&
        destination &&
        charge_type &&
        charge_name &&
        charge_code &&
        currency &&
        (tariff_20 || tariff_40 || tariff_40hc)
    ) {
        try {
            const currentDateTimestamp = moment(new Date()).format(
                "YYYY-MM-DD HH:mm:ss"
            );
            // const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            // const userQueryResponse = await executeQuery(
            //     getUserByAuthUserId,
            //     req.dbConnectionString
            // );
            // const user =
            //     userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
            let validity_date_from = null;
            let validity_date_to = null;
            if (online) {
                validity_date_from = moment(etd).format("YYYY-MM-DD 00:00:00");
                validity_date_to = moment(eta).format("YYYY-MM-DD 00:00:00");
            } else {
                validity_date_from = moment(new Date()).format("YYYY-MM-DD 00:00:00");
                validity_date_to = moment(new Date()).add(2, 'years').format("YYYY-MM-DD 00:00:00");
            }
            const type = 'EXTRA'

            if (authUserId) {
                const query = `INSERT INTO quotation_local_charges VALUES (
          DEFAULT, 
          '${validity_date_from}', 
          '${validity_date_to}', 
          '${origin}', 
          '${destination}', 
          '${charge_type}', 
          '${charge_name}', 
          '${charge_code}', 
          '${currency}', 
          '${tariff_20}',
          '${tariff_40}',
          '${tariff_40hc}',
          '${carrier}',
          '${export_import}',
           ${remarks ? remarks : null},
          '${mandatory_extra}',
          '${tariff_45}',
          '${currentDateTimestamp}', 
          '${authUserId}', 
          '${currentDateTimestamp}',
          '${authUserId}',
          '${deleted ? true : false}',
           ${via ? via : null},
           '${type}',
           ${getStringValueOrNULL(contract_number)})`;
                const insertExtraCharges = await executeQuery(
                    query,
                    req.dbConnectionString
                );
                if (insertExtraCharges.rowCount > 0) {
                    const extraLocalChargesData = await getExtraLocalCharges(
                        req.dbConnectionString,
                        origin,
                        destination,
                        authUserId
                    );
                    res
                        .status(OK)
                        .send({
                            extraLocalChargesList: extraLocalChargesData,
                            message: "Extra charges added successfully",
                        });
                } else {
                    res
                        .status(INTERNAL_SERVER_ERROR)
                        .send({ message: "Error while adding extra local charges." });
                }
            }
            res
                .status(INTERNAL_SERVER_ERROR)
                .send({ message: "Error while adding extra local charges." });
        } catch (error) {
            res
                .status(INTERNAL_SERVER_ERROR)
                .send({ message: error.message || error });
        }
    } else {
        res
            .status(INTERNAL_SERVER_ERROR)
            .send({
                message: "Please provide all information to add extra local charges",
            });
    }
};

const updateExtraLocalCharges = async (req, res) => {
    const authUserId = req.user.id;
    const { charge_name, currency, tariff_20, tariff_40, tariff_40hc, tariff_45 } = req.body;
    const id = req.params.id;
    if (charge_name && currency && (tariff_20 || tariff_40 || tariff_40hc || tariff_45)) {
        try {
            const currentDateTimestamp = moment(new Date()).format(
                "YYYY-MM-DD HH:mm:ss"
            );
            const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
            const userQueryResponse = await executeQuery(
                getUserByAuthUserId,
                req.dbConnectionString
            );
            const user =
                userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

            if (user && user.user_id) {
                const query = `UPDATE quotation_local_charges 
                          set 
                          "charge_name" = '${charge_name}',
                          "currency" = '${currency}',
                          "tariff_20" = '${tariff_20}',
                          "tariff_40" = '${tariff_40}',
                          "tariff_40hc" = '${tariff_40hc}',
                          "tariff_45" = '${tariff_45}',
                          "updated_by" = '${user.user_id}',
                          "updated_on" = '${currentDateTimestamp}'
                          where quotation_local_charges_id = '${id}'`;
                const extraLocalChargesUpdateQueryResponse = await executeQuery(
                    query,
                    req.dbConnectionString
                );
                if (
                    extraLocalChargesUpdateQueryResponse &&
                    extraLocalChargesUpdateQueryResponse.rowCount > 0
                ) {
                    return res.send({
                        message: "Extra local charges updated successfully",
                    });
                }
            }
            return res
                .status(INTERNAL_SERVER_ERROR)
                .send({ message: "Error while updating extra local charges." });
        } catch (error) {
            return res
                .status(INTERNAL_SERVER_ERROR)
                .send({ message: error.message || error });
        }
    } else {
        res
            .status(INTERNAL_SERVER_ERROR)
            .send({
                message: "Please provide all information to update extra local charges",
            });
    }
};

const deleteExtraLocalCharges = async (req, res) => {
    const id = req.params.id;
    const query = `delete from quotation_local_charges where quotation_local_charges_id = '${id}'`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res
                .status(OK)
                .send({ message: "Extra local charge deleted successfully" });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getExtraLocalCharges = async (
    dbConnectionString,
    origin,
    destination,
    user_id
) => {
    try {

        //     const getExtraLocalCharges = `select * from quotation_extra_local_charges where origin ILIKE '${origin}' and destination ILIKE '${destination}'::text`;
        //     const extraLocalChargesListQueryResult = await executeQuery(
        //         getExtraLocalCharges,
        //         dbConnectionString
        //     );

        //     const extraLocalChargesList =
        //         extraLocalChargesListQueryResult?.rows?.map((row) => ({
        //             id: row.quotation_extra_local_charges_id,
        //             origin: row.origin,
        //             destination: row.destination,
        //             chargeType: row.charge_type,
        //             chargeName: row.charge_name,
        //             chargeCode: row.charge_code,
        //             currency: row.currency,
        //             tariff20: row.tariff_20,
        //             tariff40: row.tariff_40,
        //             tariff40hc: row.tariff_40hc,
        //             createdOn: row.created_on,
        //             createdBy: row.created_by,
        //             updatedOn: row.updated_on,
        //             updatedBy: row.updated_by,
        //         })) || [];
        //     return extraLocalChargesList;
        return [];
    } catch (err) {
        console.log(err);
    }

};

const getMonthWiseMyQuotationsByState = async (dbConnectionString, state) => {
    const query = `SELECT date_trunc('month', cargo_ready_date) AS month, COUNT(*) AS count FROM my_quotations WHERE state = '${state}' GROUP BY month ORDER BY month ASC;`;
    const queryResponse = await executeQuery(query, dbConnectionString);
    const data =
        queryResponse?.rows?.map((row) => ({
            month: moment(row.month).format("MMM YY"),
            count: Number(row.count),
        })) || [];
    return data;
};

const getMonthWiseMyQuotationsCount = async (req, res) => {
    try {
        const accepted = await getMonthWiseMyQuotationsByState(
            req.dbConnectionString,
            "ACCEPTED"
        );
        const rejected = await getMonthWiseMyQuotationsByState(
            req.dbConnectionString,
            "REJECTED"
        );
        res.status(OK).send({ accepted, rejected });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getMyQuotationsCount = async (dbConnectionString) => {
    const query = "SELECT state, COUNT(*) FROM my_quotations GROUP BY state";
    const queryResponse = await executeQuery(query, dbConnectionString);
    const data = queryResponse?.rows?.reduce(
        (acc, row) => {
            acc.total += Number(row.count);
            acc[row.state?.toLowerCase()] = Number(row.count);
            return acc;
        },
        { total: 0 }
    );
    return data;
};

const getMyQuotationsSummary = async (req, res) => {
    try {
        const data = await getMyQuotationsCount(req.dbConnectionString);
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const calculateSourceAndDestinationMyQuotationsWithState = async (
    dbConnectionString
) => {
    const query = `SELECT origin, destination, state, COUNT(*) FROM my_quotations as mq
                  INNER JOIN quotation_rate_output as qro
                  ON mq.quotation_rate_output_id = qro.quotation_rate_output_id
                  GROUP BY origin, destination, state;`;
    const queryResponse = await executeQuery(query, dbConnectionString);

    const allPortData = queryResponse?.rows?.reduce((acc, row) => {
        const portKey = row.origin + " > " + row.destination;
        const state = row.state?.toLowerCase();
        if (!acc[portKey]) {
            acc[portKey] = {
                origin: row.origin,
                destination: row.destination,
                title: portKey,
                total: 0,
                accepted: 0,
                rejected: 0,
                close: 0,
                open: 0,
            };
        }
        if (acc[portKey]) {
            acc[portKey][state] = Number(row.count);
            acc[portKey].total += Number(row.count);
        }
        return acc;
    }, {});

    const data = Object.keys(allPortData).reduce(
        (acc, portKey) => {
            const currentPortData = allPortData[portKey];
            if (currentPortData.total > acc.total.count) {
                acc.total = {
                    count: currentPortData.total,
                    origin: currentPortData.origin,
                    destination: currentPortData.destination,
                    title: currentPortData.title,
                };
            }
            if (currentPortData.accepted > acc.accepted.count) {
                acc.accepted = {
                    count: currentPortData.accepted,
                    origin: currentPortData.origin,
                    destination: currentPortData.destination,
                    title: currentPortData.title,
                };
            }
            if (currentPortData.rejected > acc.rejected.count) {
                acc.rejected = {
                    count: currentPortData.rejected,
                    origin: currentPortData.origin,
                    destination: currentPortData.destination,
                    title: currentPortData.title,
                };
            }
            if (currentPortData.close > acc.close.count) {
                acc.close = {
                    count: currentPortData.close,
                    origin: currentPortData.origin,
                    destination: currentPortData.destination,
                    title: currentPortData.title,
                };
            }
            if (currentPortData.open > acc.open.count) {
                acc.open = {
                    count: currentPortData.open,
                    origin: currentPortData.origin,
                    destination: currentPortData.destination,
                    title: currentPortData.title,
                };
            }
            return acc;
        },
        {
            total: { count: 0, origin: "", destination: "", title: "" },
            accepted: { count: 0, origin: "", destination: "", title: "" },
            rejected: { count: 0, origin: "", destination: "", title: "" },
            close: { count: 0, origin: "", destination: "", title: "" },
            open: { count: 0, origin: "", destination: "", title: "" },
        }
    );

    return data;
};

const getMyQuotationsBySourceAndDestination = async (req, res) => {
    try {
        const data = await calculateSourceAndDestinationMyQuotationsWithState(
            req.dbConnectionString
        );
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};
const getMyQuotationsWeekCount = async (dbConnectionString) => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1;
    const last = first + 6;
    const firstday = new Date(curr.setDate(first)).toUTCString();
    const lastday = new Date(curr.setDate(last)).toUTCString();
    const query = `SELECT COUNT (*) FROM my_quotations  WHERE cargo_Ready_Date BETWEEN '${firstday}' AND '${lastday}';`;
    const queryResponse = await executeQuery(query, dbConnectionString);
    const cargo_Ready_Date = queryResponse?.rows?.reduce((row) => ({
        week: moment(row.week).format("MMM YY"),
        count: Number(row.count),
    }));
    return cargo_Ready_Date;
};

const getQuotationsCountForCurrentWeek = async (req, res) => {
    try {
        const data = await getMyQuotationsWeekCount(req.dbConnectionString);
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getMyQuotationsMonthCount = async (dbConnectionString) => {
    const date = new Date();
    const firstDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        +2
    ).toUTCString();
    const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1
    ).toUTCString();
    const query = `SELECT COUNT (*) FROM my_quotations  WHERE cargo_Ready_Date BETWEEN '${firstDay}' AND '${lastDay}';`;
    const queryResponse = await executeQuery(query, dbConnectionString);
    const cargo_Ready_Date = queryResponse?.rows?.reduce((row) => ({
        month: moment(row.month).format("MMM YY"),
        count: Number(row.count),
    }));
    return cargo_Ready_Date;
};

const getQuotationsCountForCurrentMonth = async (req, res) => {
    try {
        const data = await getMyQuotationsMonthCount(req.dbConnectionString);
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getAllPorts = async (req, res) => {
    const query = "SELECT * FROM onload_quotation";

    try {
        return executeQuery(query, req.dbConnectionString).then(async (data) => {
            const ports = [];
            data.rows.forEach((ca) => {
                if (ca.ports !== "") {
                    ports.push({
                        label: ca.ports,
                        value: ca.ports,
                    });
                }
            });
            res.status(OK).send({ data: ports });
        });
    } catch (err) {
        console.log(error);
        res
            .status(INTERNAL_SERVER_ERROR)
            .send({ message: err?.message || "Error while loading ports" });
    }
};

const getQuotationsCount = async (req, res) => {
    try {
        const { type, company } = req.query;
        const typeBuckets = [];
        if (type?.toUpperCase() === 'MONTHLY') {
            for (let i = 0; i < 3; i++) {
                const startMoment = moment().subtract(i, 'month').startOf('month');
                const start = startMoment.format('YYYY-MM-DD');
                const end = moment().subtract(i, 'month').endOf('month').format('YYYY-MM-DD');
                const label = startMoment.format('MMMM');
                typeBuckets.push({ start, end, label, count: 0 });
            }
        } else if (type?.toUpperCase() === 'YEARLY') {
            for (let i = 0; i < 3; i++) {
                const startMoment = moment().subtract(i, 'year').startOf('year');
                const start = startMoment.format('YYYY-MM-DD');
                const end = moment().subtract(i, 'year').endOf('year').format('YYYY-MM-DD');
                const label = startMoment.format('YYYY');
                typeBuckets.push({ start, end, label, count: 0 });
            }
        } else if (type?.toUpperCase() === 'QUATERLY') {
            for (let i = 0; i < 4; i++) {

                const startMoment = moment().startOf('year').add(i * 3, 'month');
                const start = startMoment.format('YYYY-MM-DD');

                const endMoment = moment().startOf('year').add(i * 3 + 2, 'month').endOf('month');
                const end = endMoment.format('YYYY-MM-DD');

                const label = `${startMoment.format('MMM')}-${endMoment.format('MMM')} (Q${i + 1})`;
                typeBuckets.push({ start, end, label, count: 0 });
            }
        }

        let queries = '';

        for (let i = 0; i < typeBuckets.length; i++) {
            const bucket = typeBuckets[i];
            if (!company) {
                queries = `
                ${queries}
                SELECT status, COUNT(*) FROM quotation_requests
                WHERE  (created_on BETWEEN '${bucket.start}' AND '${bucket.end}')
                GROUP BY status;
                `;
            } else {
                queries = `${queries}
                SELECT status, COUNT(*) FROM quotation_requests qr
                WHERE (created_on BETWEEN '${bucket.start}' AND '${bucket.end}') AND 
                qr.customer_id IN (SELECT customer_id FROM customer_details WHERE company = '${company}')
                GROUP BY status;
                `;
            }
        }
        const queryResponseArray = await executeQuery(queries, req.dbConnectionString);
        let data = {
            'TOTAL': JSON.parse(JSON.stringify(typeBuckets)),
            'ACCEPTED': JSON.parse(JSON.stringify(typeBuckets)),
            'REJECTED': JSON.parse(JSON.stringify(typeBuckets)),
            'PENDING': JSON.parse(JSON.stringify(typeBuckets)),
        }

        for (let i = 0; i < queryResponseArray?.length; i++) {
            const queryResponse = queryResponseArray[i];
            const rows = queryResponse?.rows || [];

            data.ACCEPTED[i].count = Number(rows.find(r => r.status === 'ACCEPTED')?.count) || 0;
            data.REJECTED[i].count = Number(rows.find(r => r.status === 'REJECTED')?.count) || 0;
            data.PENDING[i].count = (Number(rows.find(r => r.status === 'SENT')?.count) || 0) + Number(rows.find(r => r.status === 'PENDING_APPROVAL')?.count) || 0;

            data.TOTAL[i].count = Number(rows.reduce((acc, r) => {
                acc += Number(r?.count || 0);
                return acc;
            }, 0));
        }
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getContractsCount = async (req, res) => {
    try {
        const { type, carrier } = req.query;

        const typeBuckets = [];
        if (type?.toUpperCase() === 'MONTHLY') {
            for (let i = 0; i < 3; i++) {
                const startMoment = moment().subtract(i, 'month').startOf('month');
                const start = startMoment.format('YYYY-MM-DD');
                const end = moment().subtract(i, 'month').endOf('month').format('YYYY-MM-DD');
                const label = startMoment.format('MMMM');
                typeBuckets.push({ start, end, label, count: 0 });
            }
        } else if (type?.toUpperCase() === 'YEARLY') {
            for (let i = 0; i < 3; i++) {
                const startMoment = moment().subtract(i, 'year').startOf('year');
                const start = startMoment.format('YYYY-MM-DD');
                const end = moment().subtract(i, 'year').endOf('year').format('YYYY-MM-DD');
                const label = startMoment.format('YYYY');
                typeBuckets.push({ start, end, label, count: 0 });
            }
        } else if (type?.toUpperCase() === 'QUATERLY') {
            for (let i = 0; i < 4; i++) {

                const startMoment = moment().startOf('year').add(i * 3, 'month');
                const start = startMoment.format('YYYY-MM-DD');

                const endMoment = moment().startOf('year').add(i * 3 + 2, 'month').endOf('month');
                const end = endMoment.format('YYYY-MM-DD');

                const label = `${startMoment.format('MMM')}-${endMoment.format('MMM')} (Q${i + 1})`;
                typeBuckets.push({ start, end, label, count: 0 });
            }
        }

        let queries = "";

        for (let i = 0; i < typeBuckets.length; i++) {
            const bucket = typeBuckets[i];
            if (!carrier) {
                // Expired
                queries = `
                    ${queries}
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                    WHERE
                    validity_date_from < '${bucket.start}'
                    AND (validity_date_to BETWEEN '${bucket.start}' AND '${bucket.end}' );
                    `;
                // Active
                queries = `
                    ${queries}
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                        WHERE
                        validity_date_to > '${bucket.end}';`;
                // Uploaded
                queries = `
                    ${queries}    
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                    WHERE (created_on BETWEEN '${bucket.start}' AND '${bucket.end}');`;
            } else {
                // Expired
                queries = `
                    ${queries}
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                    WHERE
                    validity_date_from < '${bucket.start}'
                    AND (validity_date_to BETWEEN '${bucket.start}' AND '${bucket.end}' ) AND carrier = '${carrier}';
                    `;
                // Active
                queries = `
                    ${queries}
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                        WHERE
                        validity_date_to > '${bucket.end}' AND carrier = '${carrier}';`;
                // Uploaded
                queries = `
                    ${queries}    
                    SELECT COUNT(DISTINCT(contract_number)) as count FROM quotation_rate_output
                    WHERE (created_on BETWEEN '${bucket.start}' AND '${bucket.end}') AND carrier = '${carrier}';`;
            }
        }

        const queryResponseArray = await executeQuery(queries, req.dbConnectionString);
        let data = [
            {
                name: 'Contracts Expired',
            },
            {
                name: 'Contracts Active',
            },
            {
                name: 'Contracts Uploaded',
            },
        ];

        for (let i = 0; i < queryResponseArray?.length; i = i + 3) {
            const bucketIndex = i / 3;
            let queryResponse = queryResponseArray[i];
            let rows = queryResponse?.rows || [];
            let count = rows[0]?.count;
            data[0][typeBuckets[bucketIndex].label] = count;

            queryResponse = queryResponseArray[i + 1];
            rows = queryResponse?.rows || [];
            count = rows[0]?.count;
            data[1][typeBuckets[bucketIndex].label] = count;

            queryResponse = queryResponseArray[i + 2];
            rows = queryResponse?.rows || [];
            count = rows[0]?.count;
            data[2][typeBuckets[bucketIndex].label] = count;
        }

        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};

const getQuotationsTrend = async (req, res) => {
    const { origin, destination, carrier } = req.body;
    try {
        const typeBuckets = [];
        for (let i = 11; i >= 0; i--) {
            const startMoment = moment().subtract(i, 'month').startOf('month');
            const start = startMoment.format('YYYY-MM-DD');
            const end = moment().subtract(i, 'month').endOf('month').format('YYYY-MM-DD');
            const name = startMoment.format('MMMM');
            typeBuckets.push({ start, end, name });
        }

        let queries = '';

        for (let i = 0; i < typeBuckets.length; i++) {
            const bucket = typeBuckets[i];
            if (carrier) {
                queries = `
                ${queries}
                SELECT carrier, ROUND(AVG(tariff_20)) as "tariff20", ROUND(AVG(tariff_40)) as "tariff40", ROUND(AVG(tariff_40hc)) as "tariff40hc", ROUND(AVG(tariff_45)) as "tariff45" FROM
                quotation_rate_output
                WHERE
                origin = '${origin}' AND destination = '${destination}' AND carrier='${carrier}'
                AND
                (
                    (validity_date_from < '${bucket.start}' AND validity_date_to > '${bucket.start}')
                    OR
                    (validity_date_from >= '${bucket.start}' AND validity_date_from <= '${bucket.end}')
                ) GROUP BY carrier;
                `;
            }
            else {
                queries = `
                ${queries}
                SELECT carrier, ROUND(AVG(tariff_20)) as "tariff20", ROUND(AVG(tariff_40)) as "tariff40", ROUND(AVG(tariff_40hc)) as "tariff40hc", ROUND(AVG(tariff_45)) as "tariff45" FROM
                quotation_rate_output
                WHERE
                origin = '${origin}' AND destination = '${destination}'
                AND
                (
                    (validity_date_from < '${bucket.start}' AND validity_date_to > '${bucket.start}')
                    OR
                    (validity_date_from >= '${bucket.start}' AND validity_date_from <= '${bucket.end}')
                ) GROUP BY carrier;
                `;
            }
        }
        const queryResponseArray = await executeQuery(queries, req.dbConnectionString);
        let tariff20 = JSON.parse(JSON.stringify(typeBuckets)),
            tariff40 = JSON.parse(JSON.stringify(typeBuckets)),
            tariff40hc = JSON.parse(JSON.stringify(typeBuckets)),
            tariff45 = JSON.parse(JSON.stringify(typeBuckets));

        for (let i = 0; i < queryResponseArray?.length; i++) {
            const queryResponse = queryResponseArray[i];
            const rows = queryResponse?.rows || [];
            for (let j = 0; j < rows.length; j++) {
                const carrierDataRecord = rows[j];
                tariff20[i][carrierDataRecord?.carrier] = Number(carrierDataRecord.tariff20);
                tariff40[i][carrierDataRecord?.carrier] = Number(carrierDataRecord.tariff40);
                tariff40hc[i][carrierDataRecord?.carrier] = Number(carrierDataRecord.tariff40hc);
                tariff45[i][carrierDataRecord?.carrier] = Number(carrierDataRecord.tariff45);
            }
        }
        res.status(OK).send({
            tariff20,
            tariff40,
            tariff40hc,
            tariff45
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};


const prepareQuotationDocxData = async (requestData) => {
    const selectedCharges = requestData.selectedCharges || [];
    const quotationRequest = requestData.quotationRequest || {};
    const freightCostBreakdown = requestData.freightCostBreakdown || {};

    const containerData = [{
        label: "20GPx" + quotationRequest.tariff20,
        value: freightCostBreakdown.tariff20Value
    }, {
        label: "40GPx" + quotationRequest.tariff40,
        value: freightCostBreakdown.tariff40Value
    }, {
        label: "40HCx" + quotationRequest.tariff40hc,
        value: freightCostBreakdown.tariff40hcValue
    }];

    const shipmentDetailsData = [{
        label: "Origin",
        value: requestData.origin
    }, {
        label: "Destination",
        value: requestData.destination
    }, {
        label: "Freight Type",
        value: requestData.loadType
    }, {
        label: "Commodity",
        value: requestData.commodity
    }, {
        label: "Incoterms",
        value: requestData.incoterm
    }, {
        label: "Weight",
        value: requestData.weight
    }, {
        label: "Carrier",
        value: requestData.carrier
    }];

    const sailingScheduleDetailsData = [{
        label: "Cargo Ready Date",
        value: requestData.cargoReadyDate
    }, {
        label: "Place of Receipt",
        value: requestData.placeOfReceipt || requestData.origin
    }, {
        label: "Port of Loading",
        value: requestData.portOfLoading || requestData.origin
    }, {
        label: "Port of Discharge",
        value: requestData.portOfDischarge || requestData.destination
    }, {
        label: "Place of Delivery",
        value: requestData.placeOfDelivery || requestData.destination
    }, {
        label: "Vessel Name",
        value: requestData.vesselName
    }, {
        label: "Voyage Number",
        value: requestData.voyageNumber
    }, {
        label: "ETD",
        value: requestData.etd
    }, {
        label: "ETA",
        value: requestData.eta
    }, {
        label: "Transit Time",
        value: requestData.transitTime > 0 ? requestData.transitTime?.toString() + " Days" : ""
    }];

    let chargesSectionData = [];

    for (let i = 0; i < selectedCharges.length; i++) {
        const chargeBucket = selectedCharges[i];
        const isOceanFreight = chargeBucket.mandatory?.toUpperCase() === "OCEAN FREIGHT";
        if (chargeBucket.charges.length === 0) {
            continue;
        }
        let chargeBucketData = {
            headers: [
                [chargeBucket.label, "Charge Code", "Currency", "Tariff"],
                ["", "", ""]
            ],
            data: []
        };
        if (quotationRequest.tariff20) {
            chargeBucketData.headers[1].push("20");
        }
        if (quotationRequest.tariff40) {
            chargeBucketData.headers[1].push("40");
        }
        if (quotationRequest.tariff40hc) {
            chargeBucketData.headers[1].push("40HC");
        }
        if (quotationRequest.tariff45) {
            chargeBucketData.headers[1].push("45");
        }

        for (let j = 0; j < chargeBucket.charges.length; j++) {
            const charge = chargeBucket.charges[j];
            let row = [charge.chargeName, charge.chargeCode, charge.currency];
            if (quotationRequest.tariff20) {
                row.push(isOceanFreight || charge.type?.toUpperCase() != "EXTRA" && charge.tariff20 == 0 ? 'Included' : charge.tariff20);
            }
            if (quotationRequest.tariff40) {
                row.push(isOceanFreight || charge.type?.toUpperCase() != "EXTRA" && charge.tariff40 == 0 ? 'Included' : charge.tariff40);
            }
            if (quotationRequest.tariff40hc) {
                row.push(isOceanFreight || charge.type?.toUpperCase() != "EXTRA" && charge.tariff40hc == 0 ? 'Included' : charge.tariff40hc);
            }
            if (quotationRequest.tariff45) {
                row.push(isOceanFreight || charge.type?.toUpperCase() != "EXTRA" && charge.tariff45 == 0 ? 'Included' : charge.tariff45);
            }
            chargeBucketData.data.push(row);
        }
        chargesSectionData.push(chargeBucketData);
    }

    let data = {
        intro: {
            left: [
                {
                    label: "Sender Name",
                    value: requestData.customer.name,
                },
                {
                    label: "Company",
                    value: requestData.customer.company,
                }
            ],
            right: [
                {
                    label: "Quotation Date",
                    value: requestData.quotationDate,
                }
            ],

        },
        sections: [{
            label: "Shipment Details",
            type: "KEY_VALUE_TABLE_SECTION",
            data: shipmentDetailsData
        }, {
            label: "Container Size & Units",
            type: "KEY_VALUE_TABLE_SECTION",
            data: containerData
        }, {
            label: "Sailing Schedule Details",
            type: "KEY_VALUE_TABLE_SECTION",
            data: sailingScheduleDetailsData
        }, {
            label: "Charges",
            type: "BUCKETS_SECTION",
            data: chargesSectionData
        }, {
            label: "Total Amount",
            type: "TOTAL_AMOUNT_SECTION",
            value: "$" + requestData.totalAmount
        }]
    };

    if (!requestData.online) {
        data.intro.right.push(
            {
                label: "Valid From",
                value: requestData.validityDateFrom,
            },
            {
                label: "Valid Till",
                value: requestData.validityDateTo,
            });
    }

    return data;
}


const downloadQuotationAsWordDocument = async (req, res) => {
    try {
        const payload = req.body;
        const data = await prepareQuotationDocxData(payload);
        const fileName = "quotation.docx";
        const buffer = await getQuotationDocx(fileName, data);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + fileName
        );
        return res.status(OK).send(buffer);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while downloading quotation word document." });
    }
}

const downloadQuotationAsPDFDocument = async (req, res) => {
    try {
        const payload = req.body;
        const data = await prepareQuotationDocxData(payload);
        const fileName = "quotation.pdf";
        const buffer = await getQuotationPdf(data);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + fileName
        );
        return res.status(OK).send(buffer);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while downloading quotation word document." });
    }
}

const sendDeleteDataStatusMail = async (request, message) => {
    try {
        const mailSubject = `DELETE_DATA - ${request.fileNumber} - ${message}`;
        const text = `File Number = ${request.fileNumber}
        \n\nStatus = ${message}
        \n\nRequest = ${JSON.stringify(request)}
        `;
        const receiverEmailIds = [process.env.OFFICE365_FILESYNC_ALERTS_RECEIVERS];
        await sendMail(
            receiverEmailIds,
            mailSubject,
            "",
            text,
        );
        console.log("Mail Sent => ", mailSubject);
    } catch (err) {
        console.log("Error while sending mail => ", mailSubject, err);
        console.log(err);
    }
}

const deleteData = async (req, res) => {
    const { fileNumber, rates, charges } = req.body;
    try {
        console.log("START = DELETE DATA => ", fileNumber, rates, charges);

        let ratesDeleteQueryResponse = null;
        let chargesDeleteQueryResponse = null;

        if (rates) {
            const ratesDeleteQuery = `DELETE FROM quotation_rate_output WHERE file_number = '${fileNumber}';`;
            ratesDeleteQueryResponse = await executeQuery(ratesDeleteQuery, req.dbConnectionString);
        }
        if (charges) {
            const chargesDeleteQuery = `DELETE FROM quotation_local_charges WHERE file_number = '${fileNumber}';`;
            chargesDeleteQueryResponse = await executeQuery(chargesDeleteQuery, req.dbConnectionString);
        }
        console.log(ratesDeleteQueryResponse, chargesDeleteQueryResponse);

        const ratesDeleted = ratesDeleteQueryResponse?.rowCount;
        const chargesDeleted = chargesDeleteQueryResponse?.rowCount;
        let message = '';
        let error = false;
        if (rates) {
            if (ratesDeleted == 0) {
                message += 'No rates found to delete.';
                error = true;
            } else {
                message += `Rates Deleted = ${ratesDeleted}.`;
            }
        }
        if (charges) {
            if (chargesDeleted == 0) {
                message += 'No charges found to delete.';
            } else {
                message += `, Charges Deleted = ${chargesDeleted}.`;
                error = false;
            }
        }
        sendDeleteDataStatusMail(req.body, message);
        res.status(error ? INTERNAL_SERVER_ERROR : OK).send({ message });
        console.log("END = DELETE DATA => ", fileNumber, rates, charges);
    } catch (err) {
        sendDeleteDataStatusMail(req.body, err?.message || err);
        console.log("END = DELETE DATA => ", fileNumber, rates, charges);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || err });
    }
}

module.exports = {
    getExcelSheetTable,
    getExcelSheetTableCronJob,
    uploadAndProcessDocument,
    createQuotation,
    fetchQuotationById,
    updateQuotation,
    fetchQuotation,
    onLoadQuotations,
    quotationCompanyDetails,
    insertQuotationCompanyDetails,
    updateQuotationCompanyDetails,
    searchQuotationRates,
    addMyQuotation,
    updateMyQuotation,
    getMyQuotations,
    getMyQuotationsByLoggedInUser,
    generateMyQuotationPDF,
    saveMyQuotation,
    shareMyQuotation,
    sendFlashRate,
    confirmSearchQuote,
    sendSearchQuote,
    generateAndSendQuotationPDFViaWhatsApp,
    generateAndSendQuotationPDFViaMail,
    getChargesByOriginAndDestination,
    insertIntoExtraLocalCharges,
    updateExtraLocalCharges,
    deleteExtraLocalCharges,
    getContractNumbers,
    getDemurrageAndDetention,
    getMonthWiseMyQuotationsCount,
    getMyQuotationsSummary,
    getMyQuotationsBySourceAndDestination,
    getQuotationsCountForCurrentWeek,
    getQuotationsCountForCurrentMonth,
    getAllPorts,
    getCurrentClientData,
    getTierMargins,
    updateTierMargins,
    getTierMarginsById,
    createTierMargins,
    sendMailNotificationForNoRates,
    processExcelDocument,
    getQuotationsCount,
    getContractsCount,
    getQuotationsTrend,
    downloadQuotationAsWordDocument,
    downloadQuotationAsPDFDocument,
    deleteData
};