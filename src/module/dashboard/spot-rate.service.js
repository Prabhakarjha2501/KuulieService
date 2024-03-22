const { default: axios } = require("axios")
const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const moment = require('moment');
const excelToJson = require("convert-excel-to-json");
const { setCache, getCache, setExpirableCache } = require("../../utils/redis-service");
const executeQuery = require("../../db/connect");
const { v4: uuidv4 } = require('uuid');
const office365 = require("../zoho/office365.service");
const path = require('path');
const fs = require('fs');

const API_URL = process.env.GEEKYUM_API_URL;
const CLIENT_ID = process.env.GEEKYUM_CLIENT_ID;
const CLIENT_SECRETE = process.env.GEEKYUM_CLIENT_SECRETE;
const ACCESS_TOKEN_VALIDITY = process.env.GEEKYUM_ACCESS_TOKEN_VALIDITY;
const RATE_PAGE_SIZE = process.env.GEEKYUM_RATE_PAGE_SIZE;
const CHARGE_RATE_CACHE_EXPIRY_TIME = process.env.GEEKYUM_CHARGE_RATE_CACHE_EXPIRY_TIME;

const getPortCode = port => {
    const portCode = port?.split(", ");
    return portCode[2];
}

const getPortPairs = async () => {
    const sourceFile = await doGetAndProcessPortsDataExcelPath();
    const excelJson = excelToJson({ sourceFile });
    const portPairs = excelJson?.Sheet1?.slice(1)?.map(p => ({
        polCode: getPortCode(p.A),
        podCode: getPortCode(p.B)
    }));
    return portPairs;
}

const doGetAndProcessPortsDataExcelPath = async () => {
    const authResponse = await office365.getToken(office365.tokenRequest);
    const driveId = process.env.OFFICE365_DRIVE_ID;
    const portsFileId = process.env.OFFICE365_PORTPAIRS_FILE_ID;
    const filePath = path.join(__dirname, "PORT_PAIRS.xlsx");
    const fileContentStream = await office365.callApi(office365.apiConfig.fileContentByItemId(driveId, portsFileId), authResponse.accessToken, {
        responseType: 'stream'
    });
    const writeStream = fs.createWriteStream(filePath);
    fileContentStream.pipe(writeStream);
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
    return filePath;
}

const getSpotRateAccessToken = async () => {
    let accessTokenData = await getCache("SPOT_RATE_ACCESS_TOKEN");
    if (accessTokenData) {
        const accessToken = accessTokenData.accessToken;
        const accessTokenExpiryTime = new Date(accessTokenData.accessTokenExpiryTime);
        if (accessTokenData && accessToken && accessTokenExpiryTime && accessTokenExpiryTime > new Date()) {
            console.log("Used cached access token - ", accessToken);
            return accessTokenData;
        } else {
            console.log("Cached access token expired - ", accessTokenData, accessToken, accessTokenExpiryTime, accessTokenExpiryTime > new Date());
        }
    }
    console.log("Get Spot Rate Access Token From API");
    const response = await axios.post(`${API_URL}/link/getToken`,
        {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRETE,
            "validity_time": ACCESS_TOKEN_VALIDITY
        });
    if (response.status === 200) {
        const responseData = response.data;
        if (responseData.success && responseData.code === 200) {
            accessTokenData = {
                ...responseData.data,
                accessTokenExpiryTime: new Date(new Date().setMilliseconds(ACCESS_TOKEN_VALIDITY))
            }
            console.log("Created access token and Stored in cache - ", accessTokenData.accessToken, accessTokenData)
            setCache("SPOT_RATE_ACCESS_TOKEN", accessTokenData);
            return accessTokenData;
        } else {
            console.log("GeekRate Token API Failure - ", response.data);
        }
    }
}

const searchSpotRates = async (accessToken, {
    containerType,
    etd,
    fromServiceMode,
    podCode,
    polCode,
    page,
    size,
    toServiceMode
}) => {
    let rateResponse = await axios.post(`${API_URL}/linkRate/search?access_token=${accessToken}`,
        {
            carrierCodeList: [],
            containerType,
            etd,
            fromServiceMode,
            podCode,
            polCode,
            page,
            size,
            sort: [
                {
                    direction: "ASC",
                    property: "productStatus"
                },
                {
                    direction: "ASC",
                    property: "etd"
                }
            ],
            toServiceMode,
            uid: "402883"
        });

    if (rateResponse.status === 200) {
        const responseData = rateResponse.data;
        if (responseData.success && responseData.code === 200) {
            return responseData.data;
        } else {
            console.log("GeekRate API Failure due to token - ", rateResponse.data);
            setCache("SPOT_RATE_ACCESS_TOKEN", null);
            return false;
        }
    }
    console.log("GeekRate API Failure - ", rateResponse.data);
}

const getMatchingRate = (rateRecord, data) => {
    let matchingRecord = data.find(item => {
        return item.carrierDTO.carrierCode == rateRecord.carrierDTO.carrierCode
            && item.eta == rateRecord.eta
            && item.etd == rateRecord.etd
            && item.polDTO.code == rateRecord.polDTO.code
            && item.podDTO.code == rateRecord.podDTO.code
            && item.routeCode == rateRecord.routeCode
            && item.vesselName == rateRecord.vesselName
            && item.voyage == rateRecord.voyage;
    });
    if (!matchingRecord) {
        matchingRecord = {
            priceAmountSpot: 0,
            priceAmountQq: 0,
            priceFullAmount: 0,
            currency: "USD"
        };
    }
    return matchingRecord;
}

const searchSpotRatesForAllContainerTypes = async (accessToken, polCode, podCode, containerTyes) => {
    const spotRateCacheKey = `SPOT_RATES_${polCode}_${podCode}_${JSON.stringify(containerTyes)}_${RATE_PAGE_SIZE}`;
    const spotRates = await getCache(spotRateCacheKey);

    if (spotRates?.length > 0) {
        console.log("Used cached spot rates - ", spotRateCacheKey);
        return spotRates;
    }

    let allContainerTypes = ["40HC", "40GP", "20GP"];
    if (containerTyes) {
        const { tariff20, tariff40, tariff40hc } = containerTyes;
        allContainerTypes = [];
        if (tariff40hc) {
            allContainerTypes.push("40HC");
        }
        if (tariff20) {
            allContainerTypes.push("20GP");
        }
        if (tariff40) {
            allContainerTypes.push("40GP");
        }
    }

    let allContainerTypesPromises = allContainerTypes.map(async (containerType) => (
        await searchSpotRates(accessToken, {
            containerType,
            etd: [],
            fromServiceMode: "CY",
            polCode,
            podCode,
            page: 1,
            size: RATE_PAGE_SIZE,
            toServiceMode: "CY"
        })
    ));

    let allContainerTypesResponses = await Promise.all(allContainerTypesPromises);
    if (!allContainerTypesResponses || !allContainerTypesResponses[0] || !allContainerTypesResponses[0].content || allContainerTypesResponses[0].content?.length === 0) {

        console.log("First Unexpected GeekRate API response - ", allContainerTypesResponses, allContainerTypesResponses[0]);

        const accessTokenData = await getSpotRateAccessToken();
        accessToken = accessTokenData.accessToken;

        allContainerTypesPromises = allContainerTypes.map(async (containerType) => (
            await searchSpotRates(accessToken, {
                containerType,
                etd: [],
                fromServiceMode: "CY",
                polCode,
                podCode,
                page: 1,
                size: RATE_PAGE_SIZE,
                toServiceMode: "CY"
            })
        ));
        allContainerTypesResponses = await Promise.all(allContainerTypesPromises);

        if (!allContainerTypesResponses || !allContainerTypesResponses[0] || !allContainerTypesResponses[0].content || allContainerTypesResponses[0].content?.length === 0) {
            console.log("Second Unexpected GeekRate API response - ", allContainerTypesResponses, allContainerTypesResponses[0]);
            return [];
        }

    }

    const totalRates = allContainerTypesResponses[0].content?.length;
    let data = [];
    for (let rateIndex = 0; rateIndex < totalRates; rateIndex++) {
        let rate = {};
        for (let i = 0; i < allContainerTypes.length; i++) {
            const containerType = allContainerTypes[i];
            const containerTypeResponse = allContainerTypesResponses[i];
            console.log("containerTypeResponse.content", containerTypeResponse.content?.length, "----", containerType)
            let containerRate = {};
            if (i === 0) {
                containerRate = containerTypeResponse.content[rateIndex];
            } else {
                containerRate = getMatchingRate(rate, containerTypeResponse.content);
            }
            const {
                priceAmountSpot,
                priceAmountQq,
                priceFullAmount,
                currency,
                key,
                ...remainingRatesData
            } = containerRate

            if (i === 0) {
                rate = remainingRatesData;
            }

            rate = {
                ...rate,
                rateKeys: {
                    ...(rate.rateKeys || {}),
                    [containerType]: key
                },
                [containerType]: {
                    priceAmountSpot,
                    priceAmountQq,
                    priceFullAmount,
                    currency
                }
            }
        }
        data.push(rate);
    }
    setExpirableCache(spotRateCacheKey, data, CHARGE_RATE_CACHE_EXPIRY_TIME);
    return data;
}

const getSpotRateDetail = async (accessToken, {
    rateKey
}) => {
    try {
        const spotRateDetailCacheKey = `SPOT_RATES_DETAIL_${rateKey}`;
        const data = await getCache(spotRateDetailCacheKey);
        if (data) {
            console.log("Used cached spot rate detail - ", spotRateDetailCacheKey);
            return data;
        }

        const detailResponse = await axios.post(`${API_URL}/linkRate/detail?access_token=${accessToken}`,
            {
                key: rateKey,
                uid: "402883"
            });
        if (detailResponse.status === 200) {
            const responseData = detailResponse.data;
            if (responseData.success && responseData.code === 200) {
                setExpirableCache(spotRateDetailCacheKey, responseData.data, CHARGE_RATE_CACHE_EXPIRY_TIME);
                return responseData.data;
            }
        }
    } catch (error) {
        console.log("Error - getSpotRateDetail ", error);
        throw "Error ocurred while fetching online rates from carrier website. Please try again later or contact support.";
    }
}

const getChargeKey = (charge) => charge.priceCategory
    + "__" + charge.priceType
    + "__" + charge.currency
    + "__" + charge.chargeUnit
    + "__" + charge.priceName;

const searchSpotRateDetailForAllContainerTypes = async (accessToken, { rateKeys, carrierCode }) => {
    const allContainerTypes = ["40HC", "40GP", "20GP"].filter(containerType => rateKeys[containerType]);
    const allContainerTypesPromises = allContainerTypes.map(async (containerType) => (
        await getSpotRateDetail(accessToken, {
            rateKey: rateKeys[containerType]
        })
    ));
    const allContainerTypesResponses = await Promise.all(allContainerTypesPromises);
    let allChargeNames = [];
    for (let i = 0; i < allContainerTypesResponses?.length; i++) {
        const containerTypeDetail = allContainerTypesResponses[i];
        const containerTypeCharges = containerTypeDetail?.surcharges;
        for (let j = 0; j < containerTypeCharges?.length; j++) {
            const charge = containerTypeCharges[j];
            const chargePriceName = getChargeKey(charge);
            if (allChargeNames.indexOf(chargePriceName) === -1) {
                allChargeNames.push(chargePriceName);
            }
        }
    }
    let charges = [];
    for (let chargeIndex = 0; chargeIndex < allChargeNames?.length; chargeIndex++) {
        const chargePriceName = allChargeNames[chargeIndex];
        let allContainerChargeRecord = {};
        for (let i = 0; i < allContainerTypesResponses?.length; i++) {
            const containerType = allContainerTypes[i];
            const containerTypeSurcharges = allContainerTypesResponses[i]?.surcharges;
            const charge = containerTypeSurcharges?.find((r) => getChargeKey(r) === chargePriceName) || {};
            const { priceAmount, ...remainingCharge } = charge;
            if (Object.keys(allContainerChargeRecord)?.length === 0 && remainingCharge) {
                allContainerChargeRecord = remainingCharge;
            }
            allContainerChargeRecord.priceAmounts = {
                ...allContainerChargeRecord.priceAmounts,
                [containerType]: priceAmount
            }
        }
        charges.push(allContainerChargeRecord);
    }

    let dnds = [];
    for (let i = 0; i < allContainerTypesResponses?.length; i++) {
        const containerType = allContainerTypes[i];
        const containerTypeDnds = allContainerTypesResponses[i]?.dndFees;

        for (let j = 0; j < containerTypeDnds?.length; j++) {
            const dndRecord = containerTypeDnds[j];
            const { detailList, ...remainingDndRecord } = dndRecord;
            for (let k = 0; k < detailList?.length; k++) {
                const { chargePerDiem, ...remainingDndDetailRecord } = detailList[k];
                const dndWithoutChargePerDiem = {
                    ...remainingDndRecord,
                    ...remainingDndDetailRecord
                }

                const existingDnd = dnds.find(d => Object.keys(dndWithoutChargePerDiem).every(key => d[key] === dndWithoutChargePerDiem[key]));
                if (existingDnd) {
                    existingDnd.chargePerDiems = {
                        ...existingDnd.chargePerDiems,
                        [containerType]: chargePerDiem
                    }
                } else {
                    dnds.push({
                        ...dndWithoutChargePerDiem,
                        chargePerDiems: {
                            [containerType]: chargePerDiem
                        }
                    });
                }
            }
        }
    }
    return {
        dnds,
        charges
    }
}


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

const getPortsMap = async (dbConnectionString) => {
    let portsMap = await getCache("PORTS_MAP");
    if (portsMap) {
        return portsMap;
    }
    const portsQuery = "SELECT DISTINCT ports FROM onload_quotation;";
    const portsQueryResponse = await executeQuery(portsQuery, dbConnectionString);
    portsMap = portsQueryResponse?.rows?.reduce((acc, item) => {
        const port = item.ports;
        const portCode = port?.split(", ");
        acc[portCode[2]] = port;
        return acc;
    }, {});
    console.log("Created ports map");
    setExpirableCache("PORTS_MAP", portsMap, 3600);
    return portsMap;
}

const getCarriersMapByCode = async (dbConnectionString) => {
    let carriersMapByCode = await getCache("CARRIERS_MAP_BY_CODE");
    if (carriersMapByCode) {
        return carriersMapByCode;
    }
    const carriersQuery = "SELECT * FROM carrier_scac_code;";
    const carriersQueryResponse = await executeQuery(carriersQuery, dbConnectionString);
    carriersMapByCode = carriersQueryResponse?.rows?.reduce((acc, carrier) => {
        acc[carrier.code?.toUpperCase()] = carrier;
        return acc;
    }, {});
    setExpirableCache("CARRIERS_MAP_BY_CODE", carriersMapByCode, 3600);
    return carriersMapByCode;
}

const getRealtimeSpotRates = async (dbConnectionString, origin, destination, containerTypes) => {
    try {
        console.time("SPOT_RATES");
        const polCode = getPortCode(origin);
        const podCode = getPortCode(destination);

        const portsMap = await getPortsMap(dbConnectionString);
        const carriersMapByCode = await getCarriersMapByCode(dbConnectionString);

        const accessTokenData = await getSpotRateAccessToken();
        const accessToken = accessTokenData.accessToken;
        const spotRates = await searchSpotRatesForAllContainerTypes(accessToken, polCode, podCode, containerTypes);
        console.log("Fetched all spot rates - Count = ", spotRates?.length, spotRates[0]);

        const config = parse(dbConnectionString);
        config.ssl = {
            rejectUnauthorized: false
        }
        const connectionPool = new Pool(config);
        const databaseInstance = await connectionPool.connect();
        console.log("Created connection - ", dbConnectionString)

        let spotRatesToReturn = [];
        for (let spotRateIndex = 0; spotRateIndex < spotRates?.length; spotRateIndex++) {
            const spotRate = spotRates[spotRateIndex];
            if (!spotRate) return;
            const rateKeys = spotRate.rateKeys;

            const carrierCodeNonSCAC = spotRate.carrierDTO?.carrierCode;
            const carrierEnName = spotRate.carrierDTO?.carrierEnName;

            const carrierCode = carriersMapByCode[carrierCodeNonSCAC]?.scac_code || carriersMapByCode[carrierEnName]?.scac_code || carrierCodeNonSCAC;
            const routeCode = spotRate.routeCode;
            const vesselName = spotRate.vesselName;
            const voyage = spotRate.voyage;
            const etd = getPgSQLFormattedDate(spotRate.etd);
            const eta = getPgSQLFormattedDate(spotRate.eta);

            const polName = portsMap[polCode];
            const podName = portsMap[podCode];
            const via = "";
            const tariff20gp = spotRate['20GP']?.priceAmountSpot || 0;
            const tariff40gp = spotRate['40GP']?.priceAmountSpot || 0;
            const tariff40hc = spotRate['40HC']?.priceAmountSpot || 0;

            spotRatesToReturn.push({
                id: uuidv4(),
                carrier: carrierCode,
                vesselName: vesselName,
                voyageNumber: voyage,
                validityDateFrom: etd,
                validityDateTo: etd,
                etd: etd,
                eta: eta,
                origin: polName,
                destination: podName,
                tariff20: tariff20gp,
                tariff40: tariff40gp,
                tariff40hc: tariff40hc,
                via: via,
                routeCode: routeCode,
                rateKeys: rateKeys
            });
        }

        const trucateChargesQuery = "TRUNCATE TABLE quotation_local_charges_spottemp;";
        await databaseInstance.query(trucateChargesQuery);
        console.log("Truncated - quotation_local_charges_spottemp");

        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        await Promise.all(spotRatesToReturn.map(async (spotRate) => {
            const { rateKeys, carrier: carrierCode, origin: polName, destination: podName, etd, eta, via } = spotRate;
            console.log("Going to get charges and DnDs");
            const { charges, dnds } = await searchSpotRateDetailForAllContainerTypes(accessToken, { rateKeys, carrierCode });
            console.log("DONE - Charges and DnDs get, charges count = ", charges?.length, "dnds count = ", dnds?.length);
            for (let j = 0; j < charges?.length; j++) {
                const charge = charges[j];
                const chargeType = charge.chargeUnit;
                const priceName = charge.priceName;
                const chargeCurrency = charge.currency;
                const charge20 = charge.priceAmounts['20GP'] || 0;
                const charge40 = charge.priceAmounts['40GP'] || 0;
                const charge40hc = charge.priceAmounts['40HC'] || 0;
                const charge45 = charge.priceAmounts['45GP'] || 0;
                const mandatoryExtra = charge.priceCategory?.toLowerCase() === "freight" ? "OCEAN FREIGHT" : "Mandatory";
                const exportImport = charge.priceCategory?.toLowerCase() === "freight" ? "Origin" : charge.priceCategory;
                const remarks = charge.additionalNotes || "";

                let chargeCode = "", chargeName = "";

                const priceRegexMatch = priceName?.match('\[[A-Z]+\]');
                if (priceRegexMatch && priceRegexMatch[0]) {
                    chargeCode = priceRegexMatch[0]?.replace("[", "")?.replace("]", "");
                    chargeName = priceName?.replace(priceRegexMatch[0], "")?.trim();
                } else {
                    chargeName = priceName;
                    /*
                    const priceNameParts = priceName?.split(" - ");
                    if (priceNameParts?.length === 1) {
                        chargeName = priceName;
                    } else if (priceNameParts?.length >= 2) {
                        chargeCode = priceNameParts[0];
                        chargeName = priceNameParts[1]
                    }
                    */
                }

                const chargesInsertQuery = `INSERT INTO quotation_local_charges_spottemp
                    (validity_date_from
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
                      , remarks
                      , created_on
                      , created_by
                    )
                    VALUES
                    ( '${etd}'
                    , '${eta}'
                    , '${polName}'
                    , '${podName}'
                    , '${via}'
                    , '${chargeType}'
                    , '${chargeName}'
                    , '${chargeCode}'
                    , '${chargeCurrency}'
                    , '${charge20}'
                    , '${charge40}'
                    , '${charge40hc}'
                    , '${charge45}'
                    , '${exportImport}'
                    , '${mandatoryExtra}'
                    , '${carrierCode}'
                    , '${remarks}'
                    , '${currentDateTimestamp}'
                    , 'GEEKYUM_RATE_API' )                                
                    ON CONFLICT (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import)
                    DO NOTHING
            ;`;
                await databaseInstance.query(chargesInsertQuery);
            }
            console.log("Inserted all charges to temp table");
        }));

        const copyChargesQuery = `
    INSERT INTO quotation_local_charges 
    (
        validity_date_from
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
      , remarks
      , created_on
      , created_by
    )
    SELECT 
        validity_date_from
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
      , remarks
      , created_on
      , created_by
    FROM quotation_local_charges_spottemp
    ON CONFLICT (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import)
    DO UPDATE
    SET
        tariff_20 = EXCLUDED.tariff_20,
        tariff_40 = EXCLUDED.tariff_40,
        tariff_40hc = EXCLUDED.tariff_40hc,
        tariff_45 = EXCLUDED.tariff_45,
        currency = EXCLUDED.currency,
        remarks = EXCLUDED.remarks,
        mandatory_extra = EXCLUDED.mandatory_extra,
        updated_on = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.created_by
    ;`;
        await databaseInstance.query(copyChargesQuery);
        console.log("UPSERT charges from temp to local_charges table");


        console.timeEnd("SPOT_RATES");
        return spotRatesToReturn;
    } catch (error) {
        console.log("Error - getRealtimeSpotRates ", error);
        return [];
       // throw "Error ocurred while fetching online rates from carrier website. Please try again later or contact support.";
    }
}

const getStringValue = value => value ? `'${value}'` : "''";
const getDateValue = value => value ? `'${value}'` : "NULL";

const callGeekYumAPIAndInsertSpotRates = async (dbConnectionString, noRates) => {
    try {
        console.time("SPOT_RATES")
        const config = parse(dbConnectionString);
        config.ssl = {
            rejectUnauthorized: false
        }
        const connectionPool = new Pool(config);
        const databaseInstance = await connectionPool.connect();
        console.log("Created connection - ", dbConnectionString)
        const portsQuery = "SELECT DISTINCT ports FROM onload_quotation;";
        const portsQueryResponse = await databaseInstance.query(portsQuery);
        const portsMap = portsQueryResponse?.rows?.reduce((acc, item) => {
            const port = item.ports;
            const portCode = port?.split(", ");
            acc[portCode[2]] = port;
            return acc;
        }, {});
        console.log("Created ports map");

        const carriersQuery = "SELECT * FROM carrier_scac_code;";
        const carriersQueryResponse = await databaseInstance.query(carriersQuery);
        const carriersMapByCode = carriersQueryResponse?.rows?.reduce((acc, carrier) => {
            acc[carrier.code?.toUpperCase()] = carrier;
            return acc;
        }, {});
        console.log("Created carrier codes map", carriersMapByCode);


        const portPairs = await getPortPairs();
        let failureAttemptsCount = 0;
        let accessTokenData;
        let accessToken;
        let accessTokenExpiryTime;
        console.log("Total port pairs - ", portPairs.length, portPairs);
        for (let portIndex = 0; portIndex < portPairs.length; portIndex++) {
            try {
                const { polCode, podCode } = portPairs[portIndex];
                console.log(`### ${portIndex + 1}. START - SPOT RATE | polCode = ${polCode} => podCode = ${podCode}`);
                if (!accessTokenData || !accessToken || !accessTokenExpiryTime || accessTokenExpiryTime < new Date()) {
                    accessTokenData = await getSpotRateAccessToken();
                    accessToken = accessTokenData.accessToken;
                    accessTokenExpiryTime = accessTokenData.accessTokenExpiryTime;
                    console.log("Created access token - ", accessToken);
                } else {
                    console.log("Used cached access token - ", accessToken);
                }
                const spotRates = await searchSpotRatesForAllContainerTypes(accessToken, polCode, podCode);
                console.log("Fetched all spot rates - Count = ", spotRates?.length);

                if (portIndex === 0) {
                    /*
                    We are truncating old insertion temporary data only if GeekYum API returns response
                    */
                    const trucateRatesQuery = "TRUNCATE TABLE online_rates_spottemp;";
                    await databaseInstance.query(trucateRatesQuery);
                    console.log("Truncated - online_rates_spottemp");

                    const trucateChargesQuery = "TRUNCATE TABLE quotation_local_charges_spottemp;";
                    await databaseInstance.query(trucateChargesQuery);
                    console.log("Truncated - quotation_local_charges_spottemp");
                }

                for (let i = 0; i < spotRates?.length; i++) {
                    console.log("RATE - ", i)
                    const spotRate = spotRates[i];
                    if (!spotRate) return;
                    const rateKeys = spotRate.rateKeys;
                    // const polCode = spotRate.polDTO?.code;
                    // const podCode = spotRate.podDTO?.code;
                    const carrierCodeNonSCAC = spotRate.carrierDTO?.carrierCode;
                    const carrierEnName = spotRate.carrierDTO?.carrierEnName;
                    const carrierCode = carriersMapByCode[carrierCodeNonSCAC]?.scac_code || carriersMapByCode[carrierEnName]?.scac_code || carrierCodeNonSCAC;
                    const transportDays = spotRate.transportDay;
                    const currency = spotRate.currency;
                    const routeCode = spotRate.routeCode;
                    const containerType = spotRate.containerType;
                    const vesselName = spotRate.vesselName;
                    const voyage = spotRate.voyage;
                    const etd = getPgSQLFormattedDate(spotRate.etd);
                    const eta = getPgSQLFormattedDate(spotRate.eta);

                    const polName = portsMap[polCode];
                    const podName = portsMap[podCode];
                    const via = "";
                    const tariff20gp = spotRate['20GP'].priceAmountSpot;
                    const tariff40gp = spotRate['40GP'].priceAmountSpot;
                    const tariff40hc = spotRate['40HC'].priceAmountSpot;
                    const frequency = 0;
                    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

                    if (!noRates) {
                        const query = `INSERT INTO online_rates_spottemp
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
            , created_on
            , created_by
         )
         VALUES
            ('${polCode}'
            , '${polName}'
            , '${podCode}'
            , '${podName}'
            , '${via}'
            , '${carrierCode}'
            , '${tariff20gp}'
            , '${tariff40gp}'
            , '${tariff40hc}'
            , '${frequency}'
            , '${transportDays}'
            , '${etd}'
            , '${eta}'
            , '${vesselName}'
            , '${voyage}'
            , '${routeCode}'
            , '${currentDateTimestamp}'
            , 'GEEKYUM_RATE_API'
        )                                        
        ON CONFLICT (pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage)
        DO NOTHING
        ;`
                        await databaseInstance.query(query);
                    }
                    console.log("Going to get charges and DnDs");
                    const { charges, dnds } = await searchSpotRateDetailForAllContainerTypes(accessToken, { rateKeys, carrierCode });
                    console.log("DONE - Charges and DnDs get, charges count = ", charges?.length, "dnds count = ", dnds?.length);
                    for (let j = 0; j < charges?.length; j++) {
                        const charge = charges[j];
                        const chargeType = charge.chargeUnit;
                        const priceName = charge.priceName;
                        const chargeCurrency = charge.currency;
                        const charge20 = charge.priceAmounts['20GP'] || 0;
                        const charge40 = charge.priceAmounts['40GP'] || 0;
                        const charge40hc = charge.priceAmounts['40HC'] || 0;
                        const charge45 = charge.priceAmounts['45GP'] || 0;
                        const mandatoryExtra = charge.priceCategory?.toLowerCase() === "freight" ? "OCEAN FREIGHT" : "Mandatory";
                        const exportImport = charge.priceCategory?.toLowerCase() === "freight" ? "Origin" : charge.priceCategory;
                        const remarks = charge.additionalNotes || "";

                        let chargeCode = "", chargeName = "";

                        const priceRegexMatch = priceName?.match('\[[A-Z]+\]');
                        if (priceRegexMatch && priceRegexMatch[0]) {
                            chargeCode = priceRegexMatch[0]?.replace("[", "")?.replace("]", "");
                            chargeName = priceName?.replace(priceRegexMatch[0], "")?.trim();
                        } else {
                            chargeName = priceName;
                            /*
                            const priceNameParts = priceName?.split(" - ");
                            if (priceNameParts?.length === 1) {
                                chargeName = priceName;
                            } else if (priceNameParts?.length >= 2) {
                                chargeCode = priceNameParts[0];
                                chargeName = priceNameParts[1]
                            }
                            */
                        }

                        const chargesInsertQuery = `INSERT INTO quotation_local_charges_spottemp
                                (validity_date_from
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
                                  , remarks
                                  , created_on
                                  , created_by
                                )
                                VALUES
                                ( '${etd}'
                                , '${eta}'
                                , '${polName}'
                                , '${podName}'
                                , '${via}'
                                , '${chargeType}'
                                , '${chargeName}'
                                , '${chargeCode}'
                                , '${chargeCurrency}'
                                , '${charge20}'
                                , '${charge40}'
                                , '${charge40hc}'
                                , '${charge45}'
                                , '${exportImport}'
                                , '${mandatoryExtra}'
                                , '${carrierCode}'
                                , '${remarks}'
                                , '${currentDateTimestamp}'
                                , 'GEEKYUM_RATE_API' )                                
                                ON CONFLICT (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import)
                                DO NOTHING
                        ;`;
                        await databaseInstance.query(chargesInsertQuery);
                    }
                    console.log("Inserted all charges to temp table");
                    for (let j = 0; j < dnds?.length; j++) {

                        const dnd = dnds[j];
                        const dndDirection = dnd.direction;
                        const dndChargeType = dnd.chargeType;
                        const dndCommodity = dnd.commodity;
                        const dndDisplayName = dnd.displayName;
                        const dndFreetimeStartEvent = dnd.freetimeStartEvent;
                        const dndStartDay = dnd.startDay;
                        const dndEndDay = dnd.endDay;
                        // const dndChargeMap = dnd.chargeMap;
                        const dndCurrency = dnd.currency;
                        const dnd20 = dnd.chargePerDiems['20GP'] || 0;
                        const dnd40 = dnd.chargePerDiems['40GP'] || 0;
                        const dnd40hc = dnd.chargePerDiems['40HC'] || 0;
                        const dnd45 = dnd.chargePerDiems['45GP'] || 0;

                        const dndInsertQuery = `INSERT INTO demurrage_and_detention_v3_spottemp(
                            origin,
                            destination,
                            via,
                            carrier,
                            etd,
                            eta,
                            direction,
                            charge_type,
                            name,
                            commodity,
                            freetime_start_event,
                            start_day,
                            end_day,
                            currency,
                            cost_per_day_20gp,
                            cost_per_day_40gp,
                            cost_per_day_40hc,
                            cost_per_day_45gp,
                            created_on,
                            created_by)
                            VALUES (${getStringValue(polName)}, ${getStringValue(podName)}, ${getStringValue(via)},
                            ${getStringValue(carrierCode)}, ${getDateValue(etd)}, ${getDateValue(eta)},
                            ${dndDirection}, ${dndChargeType}, ${getStringValue(dndDisplayName)}, ${getStringValue(dndCommodity)},
                            ${getStringValue(dndFreetimeStartEvent)}, ${dndStartDay || 0}, ${dndEndDay || 0},
                            ${getStringValue(dndCurrency)},
                            ${getStringValue(dnd20)}, ${getStringValue(dnd40)},
                            ${getStringValue(dnd40hc)}, ${getStringValue(dnd45)},
                            '${currentDateTimestamp}', 'GEEKYUM_RATE_API')                                
                                ON CONFLICT (origin, destination, via, carrier, etd, eta, direction, charge_type, name, commodity, freetime_start_event, start_day, end_day)
                                DO NOTHING
                        ;`;
                        await databaseInstance.query(dndInsertQuery);
                    }
                    console.log("Inserted all DnDs to temp table");
                }

                console.log("Inserted all spot rates to temp table");

                if (!noRates) {
                    const copyRatesQuery = `INSERT INTO online_rates 
        (
        pol_code, pol_name, pod_code, pod_name, via_way_name, carrier_code,
         tariff_20gp, tariff_40gp, tariff_40hc, frequency, transport_day, etd, eta, vessel_name, voyage, route_code,
         created_on, created_by, updated_on, updated_by
        )
        SELECT 
        pol_code, pol_name, pod_code, pod_name, via_way_name, carrier_code,
         tariff_20gp, tariff_40gp, tariff_40hc, frequency, transport_day, etd, eta, vessel_name, voyage, route_code,
         created_on, created_by, updated_on, updated_by
        FROM online_rates_spottemp
        ON CONFLICT (pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage)
        DO UPDATE
        SET
            tariff_20gp = EXCLUDED.tariff_20gp,
            tariff_40gp = EXCLUDED.tariff_40gp,
            tariff_40hc = EXCLUDED.tariff_40hc,
            frequency = EXCLUDED.frequency,
            transport_day = EXCLUDED.transport_day,
            route_code = EXCLUDED.route_code,
            updated_on = CURRENT_TIMESTAMP,
            updated_by = EXCLUDED.created_by
        ;`;
                    await databaseInstance.query(copyRatesQuery);
                    console.log("UPSERT spot rates from temp to online_rates table");
                }

                const copyChargesQuery = `
        INSERT INTO quotation_local_charges 
        (
			validity_date_from
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
		  , remarks
		  , created_on
		  , created_by
        )
        SELECT 
			validity_date_from
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
		  , remarks
		  , created_on
		  , created_by
        FROM quotation_local_charges_spottemp
        ON CONFLICT (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import)
        DO UPDATE
        SET
            tariff_20 = EXCLUDED.tariff_20,
            tariff_40 = EXCLUDED.tariff_40,
            tariff_40hc = EXCLUDED.tariff_40hc,
            tariff_45 = EXCLUDED.tariff_45,
            currency = EXCLUDED.currency,
            remarks = EXCLUDED.remarks,
            mandatory_extra = EXCLUDED.mandatory_extra,
            updated_on = CURRENT_TIMESTAMP,
            updated_by = EXCLUDED.created_by
        ;`;
                await databaseInstance.query(copyChargesQuery);
                console.log("UPSERT charges from temp to local_charges table");

                const copyDnDsQuery = `
        INSERT INTO demurrage_and_detention_v3
        (
            origin,
            destination,
            via,
            carrier,
            etd,
            eta,
            direction,
            charge_type,
            name,
            commodity,
            freetime_start_event,
            start_day,
            end_day,
            currency,
            cost_per_day_20gp,
            cost_per_day_40gp,
            cost_per_day_40hc,
            cost_per_day_45gp,
            created_on,
            created_by
        )
        SELECT
            origin,
            destination,
            via,
            carrier,
            etd,
            eta,
            direction,
            charge_type,
            name,
            commodity,
            freetime_start_event,
            start_day,
            end_day,
            currency,
            cost_per_day_20gp,
            cost_per_day_40gp,
            cost_per_day_40hc,
            cost_per_day_45gp,
            created_on,
            created_by
        FROM demurrage_and_detention_v3_spottemp
        ON CONFLICT (origin, destination, via, carrier, etd, eta, direction, charge_type, name, commodity, freetime_start_event, start_day, end_day)
        DO UPDATE
        SET
            cost_per_day_20gp = EXCLUDED.cost_per_day_20gp,
            cost_per_day_40gp = EXCLUDED.cost_per_day_40gp,
            cost_per_day_40hc = EXCLUDED.cost_per_day_40hc,
            cost_per_day_45gp = EXCLUDED.cost_per_day_45gp,
            currency = EXCLUDED.currency,
            updated_on = CURRENT_TIMESTAMP,
            updated_by = EXCLUDED.created_by
        ;`;
                await databaseInstance.query(copyDnDsQuery);
                console.log("UPSERT DnDs from temp to demurrage_and_detention_v3 table");

                console.log(`### ${portIndex + 1}. DONE - SPOT RATE | polCode = ${polCode} => podCode = ${podCode}`);
            } catch (error) {
                console.log("ERROR - SPOT RATE | ", error, "failureAttemptsCount = ", failureAttemptsCount++);
                if (failureAttemptsCount === 3) {
                    throw error;
                }
            }
        }

        databaseInstance?.release();
        console.log("Released SPOT RATE DB connection");

        console.timeEnd("SPOT_RATES")
    } catch (error) {
        console.log("ERROR - SPOT RATE | ", error);
    }
};

module.exports = {
    callGeekYumAPIAndInsertSpotRates,
    getRealtimeSpotRates,
    getPortsMap,
    getPortCode
}
