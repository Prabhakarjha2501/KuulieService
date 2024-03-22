require('dotenv').config();
const moment = require('moment')
const sql = require('sql');
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const ExcelJS = require('exceljs');
const excelToJson = require('convert-excel-to-json');
const { addNotificationAndEmit } = require('../notifications/notifications.service');
const { getFormattedDate, getDateByWeekNumber, getWeekOfYear } = require('../../utils/services/shared.service');

module.exports.createAllocation = async (req, res) => {
    const authUserId = req.user.id;
    const {
        type,
        carrier,
        contractNumber,
        prefferedSupplier,
        origin,
        destination,
        sailing,
        contractType,
        totalAllocatedSpace,
        totalWeight,
        uom,
        startDate,
        endDate,
        effectiveWeek,
        expiryWeek,
        serviceCode,
        trade
    } = req.body;

    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
        const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        if (user && user.user_id) {
            const query = `
                INSERT INTO allocation_planning(
                "type", "carrier", "contract_number",
                "preffered_supplier", "origin", "destination", "sailing",
                "contract_type", "uom", "total_allocated_space", "start_date", "end_date",
                "created_on", "created_by", "updated_on", "updated_by", "total_weight", "effective_week", "expiry_week", 
                "service_code", "trade")
            VALUES
                ('${type}','${carrier}', '${contractNumber}',
                '${prefferedSupplier}','${origin}','${destination}','${sailing}',
                '${contractType}','${uom}',${totalAllocatedSpace},${startDate ? "'" + startDate + "'" : "NULL"},${endDate ? "'" + endDate + "'" : "NULL"},
                '${currentDateTimestamp}', '${user.user_id}', NULL, NULL, ${totalWeight}, ${effectiveWeek}, ${expiryWeek},
                '${serviceCode}', '${trade}')
            RETURNING id
          `;
            const response = await executeQuery(query, req.dbConnectionString);
            if (response && response.rowCount > 0) {
                const userName = user.first_name + " " + user.last_name;
                addNotificationAndEmit(req.io, req.dbConnectionString, user.user_id, authUserId, "Allocation Planning", "ALL", `${userName} has created new Allocation`, "")
                return res.send(response.rows[0])
            } else {
                console.log("Error while creating allocation.", response)
            }
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while creating allocation." });
    } catch (error) {
        console.log("createAllocation", error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error });
    }
}

module.exports.getAllAllocations = async (req, res) => {
    const query = `
        SELECT id, allocation_id, type, carrier,
        contract_number, preffered_supplier, origin, destination, sailing,
        contract_type, uom, total_allocated_space, start_date, end_date,
        created_on, created_by, updated_on, updated_by, total_weight,
        effective_week, expiry_week, service_code, trade
        FROM allocation_planning ORDER BY id DESC;
    `;
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows?.map((row) => ({
                id: row.id,
                allocationId: row.allocation_id,
                type: row.type,
                carrier: row.carrier,
                contractNumber: row.contract_number,
                prefferedSupplier: row.preffered_supplier,
                origin: row.origin,
                destination: row.destination,
                sailing: row.sailing,
                contractType: row.contract_type,
                uom: row.uom,
                totalAllocatedSpace: row.total_allocated_space,
                startDate: row.start_date,
                endDate: row.end_date,
                createdOn: row.created_on,
                createdBy: row.created_by,
                updatedOn: row.updated_on,
                updatedBy: row.updated_by,
                totalWeight: row.total_weight,
                effectiveWeek: row.effective_week,
                expiryWeek: row.expiry_week,
                serviceCode: row.service_code,
                trade: row.trade
            })) || [];
            res.status(OK).send({ data });
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.updateAllocationPerCustomer = async (req, res) => {
    const authUserId = req.user.id;
    const { allocationId } = req.params;
    const data = req.body;

    try {
        // const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
        // const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
        // const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
        // if (user && user.user_id) {
        const deleteQuery = `DELETE FROM allocation_per_customer WHERE allocation_planning_id = ${allocationId}`;
        await executeQuery(deleteQuery, req.dbConnectionString);
        const allocationPerCustomer = sql.define({
            name: 'allocation_per_customer',
            columns: [
                "allocation_planning_id",
                "company",
                "teu",
                "week",
                "total_weight",
                "created_on",
                "created_by",
                "updated_on",
                "updated_by",
            ]
        });
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const allocationPerCustomerListToInsert = data.map((row) => ({
            'allocation_planning_id': allocationId,
            'company': row.company,
            'teu': row.teu,
            'week': row.week,
            'total_weight': row.totalWeight,
            'created_on': currentDateTimestamp,
            'created_by': authUserId,
            'updated_on': null,
            'updated_by': null
        }));
        const insertQuery = allocationPerCustomer.insert(allocationPerCustomerListToInsert).toQuery();
        const queryResponse = await executeQuery(insertQuery, req.dbConnectionString);
        if (queryResponse?.rowCount >= 1) {
            // const userName = user.first_name + " " + user.last_name;
            // addNotificationAndEmit(req.io, req.dbConnectionString, user.user_id, authUserId, "Allocation Planning", "ALL", `${userName} updated customer wise allocation`, "")
            return res.status(OK).send({});
        } else {
            console.log(queryResponse);
            return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating customer allocations." });
        }
        // }
        // return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating customer allocations." });
    } catch (err) {
        console.log(err)
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.getAllAllocationPerCustomerByAllocationId = async (req, res) => {
    const { allocationId } = req.params;
    const query = `SELECT * FROM allocation_per_customer WHERE allocation_planning_id = ${allocationId};`;
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows?.map((row) => ({
                id: row.id,
                allocationPlanningId: row.allocation_planning_id,
                customerId: row.customer_id,
                teu: row.teu,
                week: row.week,
                totalWeight: row.total_weight,
                company: row.company
            })) || [];
            res.status(OK).send({ data });
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.getAllCustomerAllocations = async (req, res) => {

    try {
        const authUserId = req.user.id;
        let customerCompanyFilter = "";

        if (req.user.role === 'CUSTOMER') {
            const query = `select * from customer_details where auth_user_id = '${authUserId}'`;
            const customerQueryResponse = await executeQuery(query, req.dbConnectionString);
            const customer = customerQueryResponse?.rows.length > 0 ? customerQueryResponse?.rows[0] : null;
            const customerCompanyId = customer.company || '';
            customerCompanyFilter = `AND cmp.id = '${customerCompanyId}'`;
        }
        const query = `SELECT cmp.name as "companyName" , * FROM
                    (SELECT allocation_planning_id, company, SUM(teu) as teu FROM allocation_per_customer GROUP BY allocation_planning_id, company) apc
                    INNER JOIN allocation_planning ap
                ON apc.allocation_planning_id = ap.id 
                    INNER JOIN companies cmp
                ON apc.company = cmp.id ${customerCompanyFilter} ORDER BY ap.created_on DESC;`;
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows || [];
            res.status(OK).send({ data });
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.getAllocationReportExcel = async (req, res) => {
    try {
        const query = `
        SELECT id, allocation_id, type, carrier,
        contract_number, preffered_supplier, origin, destination, sailing,
        contract_type, uom, total_allocated_space, start_date, end_date,
        created_on, created_by, updated_on, updated_by
        FROM allocation_planning ORDER BY id DESC;`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.map((row) => ({
            id: row.id,
            allocationId: row.allocation_id,
            type: row.type,
            carrier: row.carrier,
            contractNumber: row.contract_number,
            prefferedSupplier: row.preffered_supplier,
            origin: row.origin,
            destination: row.destination,
            sailing: row.sailing,
            contractType: row.contract_type,
            uom: row.uom,
            totalAllocatedSpace: row.total_allocated_space,
            totalWeight: row.total_weight,
            week: moment(row.start_date).isoWeek(),
            startDate: row.start_date,
            endDate: row.end_date,
            createdOn: row.created_on,
            createdBy: row.created_by,
            updatedOn: row.updated_on,
            updatedBy: row.updated_by
        })) || [];

        let workbook = new ExcelJS.Workbook();
        let worksheet = workbook.addWorksheet("Allocations");

        worksheet.columns = [
            { header: "Origin", key: "origin", width: 20 },
            { header: "Destination", key: "destination", width: 20 },
            { header: "Type", key: "type", width: 20 },
            { header: "Allocation Id", key: "allocationId", width: 20 },
            { header: "Contract Number", key: "contractNumber", width: 20 },
            { header: "Week", key: "week", width: 20 },
            { header: "TEU", key: "totalAllocatedSpace", width: 20 },
            { header: "Total Weight", key: "totalWeight", width: 20 },
            { header: "Start Date", key: "startDate", width: 20 },
            { header: "End Date", key: "endDate", width: 20 }
        ];

        worksheet.addRows(data);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "AllocationReport.xlsx"
        );
        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (error) {
        console.log(error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error })
    }
}

module.exports.importAllocationsViaExcel = async (req, res) => {
    const authUserId = req.user.id;
    const sourceFile = req.file.path;
    try {
        let success = [], error = [];
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const excelJson = excelToJson({ sourceFile });
        const sheetName = Object.keys(excelJson || {})[0];

        const companiesQuery = "select * from companies";
        const companiesQueryResponse = await executeQuery(companiesQuery, req.dbConnectionString);
        const companies = companiesQueryResponse.rows || [];
        const companiesMap = companies?.reduce((acc, c) => {
            acc[c.name] = c.id;
            return acc;
        }, {});

        const portsQuery = "SELECT DISTINCT ports as name FROM onload_quotation";
        const portsQueryResponse = await executeQuery(portsQuery, req.dbConnectionString);
        const ports = portsQueryResponse.rows || [];
        const portsMap = ports?.reduce((acc, p) => {
            const portName = p.name;
            const portNameArray = portName?.split(",");
            if (portNameArray[0]) {
                const portCity = portNameArray[0].trim().toUpperCase();
                acc[portCity] = portName;
            }
            return acc;
        }, {});

        if (excelJson[sheetName] && excelJson[sheetName].length > 0) {
            const allocations = excelJson[sheetName].slice(2);
            for (let i = 0; i < allocations.length; i++) {
                let {
                    B: type,
                    C: carrier,
                    D: contractNumber,
                    E: serviceCode,
                    F: prefferedSupplier,
                    G: originCountry,
                    H: origin,
                    I: trade,
                    J: destinationCountry,
                    K: destination,
                    L: sailing,
                    M: contractType,
                    N: totalAllocatedSpace,
                    O: uom,
                    P: effectiveWeek,
                    Q: expiryWeek,
                    R: startDate,
                    S: endDate,
                    T: clientId,
                    U: weeklyAllocatedTEU,
                    V: allocationWeek
                } = allocations[i];
                console.log("allocation - ", allocations[i])
                const totalWeight = 10000;
                const weeklyWeight = 0;
                type = type?.toUpperCase();
                uom = uom?.toUpperCase();
                const company = companiesMap[clientId];
                origin = portsMap[origin?.trim()?.toUpperCase()] || origin;
                destination = portsMap[destination?.trim()?.toUpperCase()] || destination;

                console.log(startDate, endDate);
                if (effectiveWeek && expiryWeek) {
                    startDate = getDateByWeekNumber(effectiveWeek, "Monday");
                    endDate = getDateByWeekNumber(expiryWeek, "Sunday");
                } else if (startDate && endDate) {
                    startDate = getFormattedDate(startDate);
                    endDate = getFormattedDate(endDate);
                    effectiveWeek = getWeekOfYear(startDate);
                    expiryWeek = getWeekOfYear(endDate);
                } else {
                    console.log("Not valid allocation dates or weeks - ", allocations[i]);
                    error.push({ rowNumber: i + 2, data: allocations[i] });
                    continue;
                }

                console.log(startDate, endDate);

                const allocationSelectQuery = `
                    SELECT * FROM allocation_planning WHERE 
                                    type = '${type}'
                                    AND carrier = '${carrier}'
                                    AND contract_number = '${contractNumber}'
                                    AND preffered_supplier = '${prefferedSupplier}'
                                    AND origin = '${origin}'
                                    AND destination = '${destination}'
                                    AND sailing = '${sailing}'
                                    AND contract_type = '${contractType}'
                                    AND service_code = '${serviceCode}'
                                    AND trade = '${trade}'
                                    AND start_date = '${startDate}'
                                    AND end_date = '${endDate}'
                                    AND effective_week = ${effectiveWeek}
                                    AND expiry_week = ${expiryWeek}
                    `;
                const allocationSelectQueryResponse = await executeQuery(allocationSelectQuery, req.dbConnectionString);

                const allocation = allocationSelectQueryResponse?.rows?.length > 0 ? allocationSelectQueryResponse?.rows[0] : null;
                let allocationId = allocation?.id;
                if (!allocationId) {
                    const query = `
                        INSERT INTO allocation_planning(
                        "type", "carrier", "contract_number",
                        "preffered_supplier", "origin", "destination", "sailing",
                        "contract_type", "uom", "total_allocated_space", "start_date", "end_date",
                        "created_on", "created_by", "updated_on", "updated_by", "total_weight", "effective_week", "expiry_week", 
                        "service_code", "trade")
                    VALUES
                        ('${type}','${carrier}', '${contractNumber}',
                        '${prefferedSupplier}','${origin}','${destination}','${sailing}',
                        '${contractType}','${uom}',${totalAllocatedSpace},${startDate ? "'" + startDate + "'" : "NULL"},${endDate ? "'" + endDate + "'" : "NULL"},
                        '${currentDateTimestamp}', '${authUserId}', NULL, NULL, ${totalWeight}, ${effectiveWeek}, ${expiryWeek},
                        '${serviceCode}', '${trade}')
                    RETURNING id
                  `;
                    const response = await executeQuery(query, req.dbConnectionString);
                    if (response?.rowCount != 1) {
                        console.log(query, " - ", response);
                        error.push({ rowNumber: i + 2, data: allocations[i] });
                        continue;
                    }
                    allocationId = response?.rows[0].id;
                } else {
                    const allocationUpdateQuery = `UPDATE allocation_planning
                    SET uom = '${uom}', total_allocated_space = ${totalAllocatedSpace}, total_weight = ${totalWeight},
                    updated_on = '${currentDateTimestamp}', updated_by = '${authUserId}'   
                    WHERE id = ${allocationId}`;
                    const response = await executeQuery(allocationUpdateQuery, req.dbConnectionString);
                    if (response?.rowCount != 1) {
                        console.log(allocationUpdateQuery, " - ", response);
                        error.push({ rowNumber: i + 2, data: allocations[i] });
                        continue;
                    }
                }

                if (allocationId) {
                    const customerAllocationSelectQuery = `
                    SELECT * FROM allocation_per_customer
                    WHERE allocation_planning_id = ${allocationId} AND company = '${company}' AND week = ${allocationWeek};`;
                    const customerAllocationSelectQueryResponse = await executeQuery(customerAllocationSelectQuery, req.dbConnectionString);
                    const customerAllocationId = customerAllocationSelectQueryResponse?.rows?.length > 0 ? customerAllocationSelectQueryResponse?.rows[0].id : null;
                    if (customerAllocationId) {
                        const customerAllocationUpdateQuery = `UPDATE allocation_per_customer
                        SET teu = ${weeklyAllocatedTEU}, total_weight = ${weeklyWeight},
                        updated_on = '${currentDateTimestamp}', updated_by = '${authUserId}'
                        WHERE id = '${customerAllocationId}';`;
                        const customerAllocationUpdateQueryResponse = await executeQuery(customerAllocationUpdateQuery, req.dbConnectionString);
                        if (customerAllocationUpdateQueryResponse?.rowCount != 1) {
                            console.log(customerAllocationUpdateQuery, " - ", customerAllocationUpdateQueryResponse);
                            error.push({ rowNumber: i + 2, data: allocations[i] });
                            continue;
                        }
                    } else {
                        const customerAllocationInsertQuery = `INSERT INTO allocation_per_customer(
                            allocation_planning_id, company, teu, week, total_weight, created_on, created_by, updated_on, updated_by)
                            VALUES (${allocationId}, '${company}', ${weeklyAllocatedTEU}, ${allocationWeek}, ${weeklyWeight}, '${currentDateTimestamp}', '${authUserId}', NULL, NULL);`;
                        const customerAllocationInsertQueryResponse = await executeQuery(customerAllocationInsertQuery, req.dbConnectionString);
                        if (customerAllocationInsertQueryResponse?.rowCount != 1) {
                            console.log(customerAllocationInsertQuery, " - ", customerAllocationInsertQueryResponse);
                            error.push({ rowNumber: i + 2, data: allocations[i] });
                            continue;
                        }
                    }
                    success.push({ rowNumber: i + 2, data: allocations[i] });
                }
            }
            return res.send({
                success,
                error
            });
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Error while importing allocations' });
    } catch (error) {
        console.log(error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error })
    }
}

module.exports.getSpaceUtilization = async (req, res) => {
    const data = req.body || {};
    try {
        let query = Object.keys(data).reduce((acc, key) => {
            if (acc === "") {
                acc = `${key} = '${data[key]}'`;
            } else {
                acc = acc + ` AND ${key} = '${data[key]}'`;
            }
            return acc;
        }, "");

        if (query != "") {
            query = " WHERE " + query;
        }

        const getTotalAllocatedSpaceQuery = `SELECT SUM(total_allocated_space) as allocation FROM allocation_planning ${query};`

        const getCustomerWiseAllocatedSpaceQuery = `SELECT SUM(apc.teu) as released_space FROM (SELECT * FROM allocation_planning ${query}) as ap INNER JOIN allocation_per_customer as apc ON ap.id = apc.allocation_planning_id;`

        const getTotalAllocatedSpaceQueryResponse = await executeQuery(getTotalAllocatedSpaceQuery, req.dbConnectionString);
        const getCustomerWiseAllocatedSpaceQueryResponse = await executeQuery(getCustomerWiseAllocatedSpaceQuery, req.dbConnectionString);

        if (
            getTotalAllocatedSpaceQueryResponse
            && getTotalAllocatedSpaceQueryResponse.rowCount > 0
            && getCustomerWiseAllocatedSpaceQueryResponse
            && getCustomerWiseAllocatedSpaceQueryResponse.rowCount > 0
        ) {
            const allocation = getTotalAllocatedSpaceQueryResponse.rows[0].allocation;
            const releasedSpace = getCustomerWiseAllocatedSpaceQueryResponse.rows[0].released_space;
            return res.status(OK).send({
                allocation,
                releasedSpace
            });
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Error while fetching allocation data.' });
    } catch (error) {
        console.log(error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error });
    }
}

module.exports.getCustomerWiseAllocation = async (req, res) => {
    const data = req.body || {};
    try {
        let query = Object.keys(data).reduce((acc, key) => {
            if (acc === "") {
                acc = `${key} = '${data[key]}'`;
            } else {
                acc = acc + ` AND ${key} = '${data[key]}'`;
            }
            return acc;
        }, "");

        if (query != "") {
            query = " WHERE " + query;
        }

        const getTotalAllocatedSpaceQuery = `SELECT SUM(total_allocated_space) as allocation FROM allocation_planning ${query};`

        const getCustomerWiseAllocatedSpaceQuery = `SELECT apc.customer_id as customerId, SUM(apc.teu) FROM (SELECT * FROM allocation_planning ${query}) as ap INNER JOIN allocation_per_customer as apc ON ap.id = apc.allocation_planning_id GROUP BY apc.customer_id;`

        const getTotalAllocatedSpaceQueryResponse = await executeQuery(getTotalAllocatedSpaceQuery, req.dbConnectionString);
        const getCustomerWiseAllocatedSpaceQueryResponse = await executeQuery(getCustomerWiseAllocatedSpaceQuery, req.dbConnectionString);

        if (
            getTotalAllocatedSpaceQueryResponse
            && getTotalAllocatedSpaceQueryResponse.rowCount > 0
            && getCustomerWiseAllocatedSpaceQueryResponse
            && getCustomerWiseAllocatedSpaceQueryResponse.rows
        ) {
            const allocation = getTotalAllocatedSpaceQueryResponse.rows[0].allocation;
            const customerWiseAllocation = getCustomerWiseAllocatedSpaceQueryResponse.rows;
            return res.status(OK).send({
                allocation,
                customerWiseAllocation
            });
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Error while fetching allocation data.' });
    } catch (error) {
        console.log(error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error });
    }
}

module.exports.getWeekwiseAllocationByAllocationId = async (req, res) => {
    const { allocationId } = req.params;
    const query = `SELECT * FROM weekwise_allocation WHERE allocation_planning_id = ${allocationId};`;
    try {
        return executeQuery(query, req.dbConnectionString).then((queryResponse) => {
            const data = queryResponse.rows?.reduce((acc, row) => {
                acc[row.week] = row.teu;
                return acc;
            }, {});
            res.status(OK).send(data);
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.updateWeekwiseAllocationByAllocationId = async (req, res) => {
    const { allocationId } = req.params;
    const data = req.body;
    try {
        const deleteQuery = `DELETE FROM weekwise_allocation WHERE allocation_planning_id = ${allocationId};`;

        await executeQuery(deleteQuery, req.dbConnectionString);

        const weekwiseAllocation = sql.define({
            name: 'weekwise_allocation',
            columns: [
                "allocation_planning_id",
                "week",
                "teu",
                "created_on",
                "created_by",
                "updated_on",
                "updated_by",
            ]
        });

        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

        const DataToInsert = Object.keys(data).map((week) => ({
            'allocation_planning_id': allocationId,
            'week': week,
            'teu': data[week],
            'created_on': currentDateTimestamp,
            'created_by': null,
            'updated_on': null,
            'updated_by': null
        }));

        const insertQuery = weekwiseAllocation.insert(DataToInsert).toQuery();
        await executeQuery(insertQuery, req.dbConnectionString);

        res.status(OK).send();
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.getPlanVsActualSummary = async (req, res) => {
    const totalQuotationsCountQuery = `SELECT COUNT(*) FROM my_quotations;`;
    const confirmedQuotationsCountQuery = `SELECT COUNT(*) FROM my_quotations WHERE state = 'CONFIRMED';`;
    const acceptedQuotationsCountQuery = `SELECT COUNT(*) FROM my_quotations WHERE state = 'ACCEPTED';`;
    const confirmedTeuCountQuery = `SELECT SUM(tariff20) + SUM(tariff40)*2 + SUM(tariff40hc)*2 as booked FROM my_quotations WHERE state = 'CONFIRMED';`;
    const acceptedTeuCountQuery = `SELECT SUM(tariff20) + SUM(tariff40)*2 + SUM(tariff40hc)*2 as pending FROM my_quotations WHERE state = 'ACCEPTED';`;
    try {
        const totalQuotationsCountQueryResponse = await executeQuery(totalQuotationsCountQuery, req.dbConnectionString);
        const confirmedQuotationsCountQueryResponse = await executeQuery(confirmedQuotationsCountQuery, req.dbConnectionString);
        const acceptedQuotationsCountQueryResponse = await executeQuery(acceptedQuotationsCountQuery, req.dbConnectionString);
        const confirmedTeuCountQueryResponse = await executeQuery(confirmedTeuCountQuery, req.dbConnectionString);
        const acceptedTeuCountQueryResponse = await executeQuery(acceptedTeuCountQuery, req.dbConnectionString);

        res.status(OK).json({
            totalCount: totalQuotationsCountQueryResponse?.rows && +totalQuotationsCountQueryResponse?.rows[0].count || 0,
            bookedCount: confirmedQuotationsCountQueryResponse?.rows && +confirmedQuotationsCountQueryResponse?.rows[0].count || 0,
            pendingCount: acceptedQuotationsCountQueryResponse?.rows && +acceptedQuotationsCountQueryResponse?.rows[0].count || 0,
            bookedTeuCount: confirmedTeuCountQueryResponse?.rows && +confirmedTeuCountQueryResponse?.rows[0].booked || 0,
            pendingTeuCount: acceptedTeuCountQueryResponse?.rows && +acceptedTeuCountQueryResponse?.rows[0].pending || 0
        });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports.getPlanVsActual = async (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let allocationsQuery = `SELECT * FROM allocation_planning`;
    if (startDate && endDate) {
        const formattedStartDate = moment(startDate).format('YYYY-MM-DD HH:mm:ss');
        const formattedEndDate = moment(endDate).format('YYYY-MM-DD HH:mm:ss');
        allocationsQuery = `${allocationsQuery} AS a WHERE
            (a.start_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}')
            AND
            (a.end_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}')`;
    }

    const query = `
            SELECT a.carrier, COALESCE(SUM(a.total_allocated_space), 0) AS total, COALESCE(SUM(a.booked), 0) AS booked, COALESCE(SUM(a.bookedquotations), 0) AS bookedquotations, COALESCE(SUM(a.pending), 0) AS pending, COALESCE(SUM(a.pendingquotations), 0) AS pendingquotations, COALESCE(SUM(a.quoted), 0) AS quoted, COALESCE(SUM(a.totalquotations), 0) AS totalquotations
            FROM (
                SELECT a.*, q.quoted, q.totalquotations FROM
                    (SELECT a.*, p.pending, p.pendingquotations FROM
                        (SELECT a.*, b.booked, b.bookedquotations FROM
                            (SELECT a.carrier, a.contract_number, SUM(a.total_allocated_space) as total_allocated_space, a.quotation_rate_output_id
                                FROM (SELECT
                                ap.id, ap.carrier, ap.start_date, ap.end_date, ap.origin, ap.destination, ap.contract_number, ap.total_allocated_space, qro.quotation_rate_output_id
                            FROM (${allocationsQuery}) ap LEFT JOIN quotation_rate_output qro
                            ON
                                ap.origin ILIKE qro.origin
                                AND ap.destination ILIKE qro.destination
                                AND ap.contract_number = qro.contract_number
                                AND ap.carrier = qro.carrier) AS a
                            GROUP BY a.carrier, a.contract_number, a.quotation_rate_output_id) AS a
                        LEFT JOIN
                            (SELECT quotation_rate_output_id, SUM(tariff20) + SUM(tariff40)*2 + SUM(tariff40hc)*2 as booked, COUNT(*) as bookedquotations FROM (SELECT * FROM my_quotations WHERE state = 'CONFIRMED') AS bq GROUP BY quotation_rate_output_id) AS b
                        ON a.quotation_rate_output_id = b.quotation_rate_output_id
                        ) AS a
                    LEFT JOIN
                        (SELECT quotation_rate_output_id, SUM(tariff20) + SUM(tariff40)*2 + SUM(tariff40hc)*2 as pending, COUNT(*) as pendingquotations FROM (SELECT * FROM my_quotations WHERE state = 'ACCEPTED') AS bq GROUP BY quotation_rate_output_id) AS p
                    ON a.quotation_rate_output_id = p.quotation_rate_output_id
                    ) AS a
                LEFT JOIN
                    (SELECT quotation_rate_output_id, SUM(tariff20) + SUM(tariff40)*2 + SUM(tariff40hc)*2 as quoted, COUNT(*) as totalquotations FROM (SELECT * FROM my_quotations) AS bq GROUP BY quotation_rate_output_id) AS q
                ON a.quotation_rate_output_id = q.quotation_rate_output_id
            ) AS a
            GROUP BY a.carrier ORDER by booked DESC;
    `;
    try {
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).json((queryResponse?.rows || []).map(row => ({
            carrier: row.carrier,
            total: Number(row.total),
            booked: Number(row.booked),
            bookedQuotations: Number(row.bookedquotations),
            pending: Number(row.pending),
            pendingQuotations: Number(row.pendingquotations),
            quoted: Number(row.quoted),
            totalQuotations: Number(row.totalquotations),
        })));
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}