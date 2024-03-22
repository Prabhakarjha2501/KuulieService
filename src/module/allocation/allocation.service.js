require('dotenv').config();
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const moment = require('moment');

const downloadExcel = async (req, res) => {
    let csvData = `Type,Carrier Name,Service,Preferred Supplier,Port of Loading,Port of Discharge,Sailing,Contract Type,Planned Allocated Space,Actual Allocated Space,UoM,Planned Cost,Actual Cost,Start Date,End Date,Planned_week_01,Planned_week_02,Planned_week_03,Planned_week_04,Planned_week_05,Planned_week_06,Planned_week_07,Planned_week_08,Planned_week_09,Planned_week_10,Planned_week_11,Planned_week_12,Planned_week_13,Planned_week_14,Planned_week_15,Planned_week_16,Planned_week_17,Planned_week_18,Planned_week_19,Planned_week_20,Planned_week_21,Planned_week_22,Planned_week_23,Planned_week_24,Planned_week_25,Planned_week_26,Planned_week_27,Planned_week_28,Planned_week_29,Planned_week_30,Planned_week_31,Planned_week_32,Planned_week_33,Planned_week_34,Planned_week_35,Planned_week_36,Planned_week_37,Planned_week_38,Planned_week_39,Planned_week_40,Planned_week_41,Planned_week_42,Planned_week_43,Planned_week_44,Planned_week_45,Planned_week_46,Planned_week_47,Planned_week_48,Planned_week_49,Planned_week_50,Planned_week_51,Planned_week_52,Actual_week_01,Planned_week_02,Actual_week_03,Actual_week_04,Actual_week_05,Actual_week_06,Actual_week_07,Actual_week_08,Actual_week_09,Actual_week_10,Actual_week_11,Actual_week_12,Actual_week_13,Actual_week_14,Actual_week_15,Actual_week_16,Actual_week_17,Actual_week_18,Actual_week_19,Actual_week_20,Actual_week_21,Actual_week_22,Actual_week_23,Actual_week_24,Actual_week_25,Actual_week_26,Actual_week_27,Actual_week_28,Actual_week_29,Actual_week_30,Actual_week_31,Actual_week_32,Actual_week_33,Actual_week_34,Actual_week_35,Actual_week_36,Actual_week_37,Actual_week_38,Actual_week_39,Actual_week_40,Actual_week_41,Actual_week_42,Actual_week_43,Actual_week_44,Actual_week_45,Actual_week_46,Actual_week_47,Actual_week_48,Actual_week_49,Actual_week_50,Actual_week_51,Actual_week_52`;
    await fetchAlltheCarrierAllocation(req, (data) => {
        csvData += '\r\n' + data;
        res.setHeader("Content-Disposition", "attachment; filename=carrier-allocation-details.csv");
        res.write(csvData);
        res.end();
    });
}
// Excel download
const fetchAlltheCarrierAllocation = async (req, res) => {
    const query = `select * from carrier_allocation_new`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            let carrier_alloction = "";
            data.rows.sort((a, b) => b.ca_id - a.ca_id);
            data.rows.forEach((caData) => {
                carrier_alloction += `'${caData.container_type}', '${caData.container_name}', '${caData.service}',	'${caData.supplier}',	'${caData.origin}',	'${caData.destination}',	'${caData.sailing}',	'${caData.type}','${caData.total_allocated_space}',	'${caData.actual_allocated_space}',	'${caData.uom}',	'${caData.planned_costs}',	'${caData.actual_costs}',	'${caData.start_date}',	'${caData.end_date}',	'${caData.week_1}',	'${caData.week_2}',	'${caData.week_3}',	'${caData.week_4}',	'${caData.week_5}',	'${caData.week_6}',	'${caData.week_7}',	'${caData.week_8}',	'${caData.week_9}',	'${caData.week_10}',	'${caData.week_11}',	'${caData.week_12}',	'${caData.week_13}',	'${caData.week_14}',	'${caData.week_15}',	'${caData.week_16}',	'${caData.week_17}',	'${caData.week_18}',	'${caData.week_19}',	'${caData.week_20}',	'${caData.week_21}',	'${caData.week_22}',	'${caData.week_23}',	'${caData.week_24}',	'${caData.week_25}',	'${caData.week_26}',	'${caData.week_27}',	'${caData.week_28}',	'${caData.week_29}',	'${caData.week_30}',	'${caData.week_31}',	'${caData.week_32}',	'${caData.week_33}',	'${caData.week_34}',	'${caData.week_35}',	'${caData.week_36}',	'${caData.week_37}',	'${caData.week_38}',	'${caData.week_39}',	'${caData.week_40}',	'${caData.week_41}',	'${caData.week_42}',	'${caData.week_43}',	'${caData.week_44}',	'${caData.week_45}',	'${caData.week_46}',	'${caData.week_47}',	'${caData.week_48}',	'${caData.week_49}',	'${caData.week_50}',	'${caData.week_51}',	'${caData.week_52}',	'${caData.actual_week_1}',	'${caData.actual_week_2}',	'${caData.actual_week_3}',	'${caData.actual_week_4}',	'${caData.actual_week_5}',	'${caData.actual_week_6}',	'${caData.actual_week_7}',	'${caData.actual_week_8}','${caData.actual_week_9}','${caData.actual_week_10}',	'${caData.actual_week_11}',	'${caData.actual_week_12}',	'${caData.actual_week_13}',	'${caData.actual_week_14}',	'${caData.actual_week_15}',	'${caData.actual_week_16}',	'${caData.actual_week_17}',	'${caData.actual_week_18}',	'${caData.actual_week_19}',	'${caData.actual_week_20}',	'${caData.actual_week_21}',	'${caData.actual_week_22}',	'${caData.actual_week_23}',	'${caData.actual_week_24}',	'${caData.actual_week_25}',	'${caData.actual_week_26}',	'${caData.actual_week_27}',	'${caData.actual_week_28}',	'${caData.actual_week_29}',	'${caData.actual_week_30}',	'${caData.actual_week_31}',	'${caData.actual_week_32}',	'${caData.actual_week_33}',	'${caData.actual_week_34}',	'${caData.actual_week_35}',	'${caData.actual_week_36}',	'${caData.actual_week_37}',	'${caData.actual_week_38}',	'${caData.actual_week_39}',	'${caData.actual_week_40}',	'${caData.actual_week_41}',	'${caData.actual_week_42}',	'${caData.actual_week_43}',	'${caData.actual_week_44}',	'${caData.actual_week_45}',	'${caData.actual_week_46}',	'${caData.actual_week_47}',	'${caData.actual_week_48}',	'${caData.actual_week_49}',	'${caData.actual_week_50}',	'${caData.actual_week_51}',	'${caData.actual_week_52}'`
                carrier_alloction += '\r\n';
            })
            res(carrier_alloction);
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}
//post data in carrier allocation
const carrierAllocationNew = async (req, res) => {
    const { containerType, containerName, service, supplier, origin, destination, sailing, type, totalAllocatedSpace, startDate, endDate } = req.body.postData;

    let isValid = checkDateIsInYear(startDate, endDate);
    if (!isValid) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: 'startdate and enddate should not be more than 52 weeks' });
    }
    Date.prototype.getWeek = function () {
        var onejan = new Date(this.getFullYear(), 0, 1);
        var today = new Date(this.getFullYear(), this.getMonth(), this.getDate());
        var dayOfYear = ((today - onejan + 86400000) / 86400000);
        return Math.ceil(dayOfYear / 7)
    };

    let today = new Date(startDate);
    let currentWeekNumber = today.getWeek();

    let lastDay = new Date(endDate);
    let lastWeekNumber = lastDay.getWeek();

    let query01 = `INSERT INTO carrier_allocation_new("container_type", "container_name", "service", "supplier", "origin", 
    "destination", "sailing", "type", "total_allocated_space", "start_date", "end_date",`

    let values = `'${containerType}','${containerName}','${service}','${supplier}','${origin}','${destination}',
    '${sailing}', '${type}', '${totalAllocatedSpace}', '${startDate}','${endDate}' 
    ,`;

    if (currentWeekNumber >= lastWeekNumber) {
        let i = 0;
        for (let i = currentWeekNumber + 1; i < 53; i++) {
            query01 += `"week_${i}",`;
            values += "0,";
        }
        for (let i = 1; i <= lastWeekNumber; i++) {
            query01 += `"week_${i}",`;
            values += "0,";
        }
    } else {
        for (let i = currentWeekNumber + 1; i <= lastWeekNumber; i++) {
            query01 += `"week_${i}",`;
            values += "0,";
        }
    }
    query01 += '"created_on")';
    query01 = query01 + `
    VALUES (${values} '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' );`

    try {
        return executeQuery(query01, req.dbConnectionString).then((data) => {
            res.status(OK).send({ ca_id: data, message: 'carrier allocation successfully created.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}
//fetch data from carrier allocation
const fetchAllCarrierAllocation = async (req, res) => {
    const query = `select * from carrier_allocation_new`;
    let myData = [];
    let defaultValue = "-1";
    let jsonStr = '{';
    let weekDetails = `,"week_details":[`;
    let isTrue = true;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            // Sort data based on ca_id
            data.rows.sort((a, b) => b.ca_id - a.ca_id);

            data.rows.forEach((carrierData) => {
                var key = Object.keys(carrierData).filter((key) => { return carrierData[key] !== defaultValue });
                key.forEach((ownKey) => {
                    if (/^week/.test(ownKey)) {
                        weekDetails += `{"${ownKey}" : "${carrierData[ownKey]}"},`;
                        isTrue = false;
                    } else {
                        jsonStr += `"${ownKey}" : "${carrierData[ownKey]}",`
                    }
                });
                jsonStr = jsonStr.slice(0, -1);
                if (!isTrue) {
                    weekDetails = weekDetails.slice(0, -1);
                    weekDetails += ']';
                    jsonStr += weekDetails;
                    weekDetails = "";
                    weekDetails = `,"week_details":[`;
                }
                jsonStr += '}';
                myData.push(JSON.parse(jsonStr));
                jsonStr = {};
                jsonStr = '{';
            })
            res.status(OK).send({ data: myData, message: 'feched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const checkDateIsInYear = (startDate, endDate) => {

    var date1 = new Date(startDate);
    var date2 = new Date(endDate);
    // To calculate the time difference of two dates
    var Difference_In_Time = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

    if (Difference_In_Days > 365) return false;
    return true;
}

const onLoadCarrierAllocation = async (req, res) => {

    const query = `select * from onload_ca;`;
    let carrierName = [];
    let service = [];
    let contractNumber = [];
    let ports = [];
    let contactType = [];
    let containerType = [];

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            console.log(data);


            data.rows.forEach((ca) => {

                if (ca.contract_number !== '') {
                    contractNumber.push({
                        label: ca.contract_number,
                        value: ca.contract_number
                    })
                }
                if (ca.carrier_name !== '') {
                    carrierName.push({
                        label: ca.carrier_name,
                        value: ca.carrier_name
                    });
                    service.push({
                        label: ca.service,
                        value: ca.service
                    });
                }

                if (ca.ports !== "") {
                    ports.push({
                        label: ca.ports,
                        value: ca.ports
                    })
                }

                if (ca.contract_type !== '') {
                    contactType.push({
                        label: ca.contract_type,
                        value: ca.contract_type
                    })
                }

                if (containerType !== '') {
                    containerType.push({
                        label: ca.container_type,
                        value: ca.container_type
                    })
                }
            })

            const json = {
                "type": [
                    {
                        "label": "Air",
                        "value": "air"
                    },
                    {
                        "label": "Sea",
                        "value": "sea"
                    }

                ],
                "preferredSupplier": contractNumber,
                "carrierName": carrierName,
                "service": service,
                "portOfLoading": ports,
                "portOfDischarge": ports,
                "contractType": contactType,
                "containerType": containerType
            }
            res.status(OK).send({ data: json, message: 'feched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//update carrier allocation
const updateCarrierAllocation = async (req, res) => {
    const { ca_id } = req.params;
    const { container_type, container_name, service, supplier, origin, destination, sailing, type, uom, total_allocated_space } = req.body;

    const query = `UPDATE carrier_allocation_new 
            set 
            "container_type" = '${container_type || ''}',
            "container_name" = '${container_name || ''}',
            "service" = '${service || ''}',
            "supplier" = '${supplier || ''}',
            "origin" = '${origin || ''}',
            "destination" = '${destination || ''}',
            "sailing" = '${sailing || ''}',
            "type" = '${type || ''}',
            "uom" = '${uom || ''}',
            "total_allocated_space" = '${total_allocated_space || ''}',
            "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'
            where ca_id = ${ca_id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: `Carrier Allocation values updated successfully for ca_id ${ca_id}` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//update target values
const updateTargetValues = async (req, res) => {
    const { ca_id } = req.params;
    const {
        week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10,
        week_11, week_12, week_13, week_14, week_15, week_16, week_17, week_18, week_19, week_20,
        week_21, week_22, week_23, week_24, week_25, week_26, week_27, week_28, week_29, week_30,
        week_31, week_32, week_33, week_34, week_35, week_36, week_37, week_38, week_39, week_40,
        week_41, week_42, week_43, week_44, week_45, week_46, week_47, week_48, week_49, week_50,
        week_51, week_52 } = req.body;

    const query = `UPDATE carrier_allocation_new 
            set 
            "week_1" = '${week_1 || ''}', 
            "week_2" = '${week_2 || ''}', 
            "week_3" = '${week_3 || ''}', 
            "week_4" = '${week_4 || ''}',
            "week_5" = '${week_5 || ''}', 
            "week_6" = '${week_6 || ''}', 
            "week_7" = '${week_7 || ''}', 
            "week_8" = '${week_8 || ''}',
            "week_9" = '${week_9 || ''}', 
            "week_10" = '${week_10 || ''}', 
            "week_11" = '${week_11 || ''}',
            "week_12" = '${week_12 || ''}', 
            "week_13" = '${week_13 || ''}', 
            "week_14" = '${week_14 || ''}',
            "week_15" = '${week_15 || ''}', 
            "week_16" = '${week_16 || ''}', 
            "week_17" = '${week_17 || ''}', 
            "week_18" = '${week_18 || ''}',
            "week_19" = '${week_19 || ''}', 
            "week_20" = '${week_20 || ''}',
            "week_21" = '${week_21 || ''}', 
            "week_22" = '${week_22 || ''}', 
            "week_23" = '${week_23 || ''}', 
            "week_24" = '${week_24 || ''}',
            "week_25" = '${week_25 || ''}', 
            "week_26" = '${week_26 || ''}', 
            "week_27" = '${week_27 || ''}', 
            "week_28" = '${week_28 || ''}',
            "week_29" = '${week_29 || ''}', 
            "week_30" = '${week_30 || ''}', 
            "week_31" = '${week_31 || ''}', 
            "week_32" = '${week_32 || ''}', 
            "week_33" = '${week_33 || ''}', 
            "week_34" = '${week_34 || ''}',
            "week_35" = '${week_35 || ''}', 
            "week_36" = '${week_36 || ''}', 
            "week_37" = '${week_37 || ''}', 
            "week_38" = '${week_38 || ''}',
            "week_39" = '${week_39 || ''}', 
            "week_40" = '${week_40 || ''}', 
            "week_41" = '${week_41 || ''}', 
            "week_42" = '${week_42 || ''}', 
            "week_43" = '${week_43 || ''}', 
            "week_44" = '${week_44 || ''}',
            "week_45" = '${week_45 || ''}', 
            "week_46" = '${week_46 || ''}', 
            "week_47" = '${week_47 || ''}', 
            "week_48" = '${week_48 || ''}',
            "week_49" = '${week_49 || ''}', 
            "week_50" = '${week_50 || ''}', 
            "week_51" = '${week_51 || ''}', 
            "week_52" = '${week_52 || ''}', 
            "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'
            where ca_id = ${ca_id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: `Week values updated successfully for ca_id ${ca_id}` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//delete target values
const deleteTargetValues = async (req, res) => {
    const { ca_id } = req.params;
    const query = `delete from carrier_allocation_new where ca_id = ${ca_id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ ca_id: data, message: 'allocation deleted successful' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//get weekwise allocation
const fetchWeekAllocation = async (req, res) => {
    const { ca_id } = req.params;
    const {week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10, week_11, week_12, week_13, week_14, week_15, week_16, week_17, week_18, week_19, week_20,
        week_21, week_22, week_23, week_24, week_25, week_26, week_27, week_28, week_29, week_30,
        week_31, week_32, week_33, week_34, week_35, week_36, week_37, week_38, week_39, week_40,
        week_41, week_42, week_43, week_44, week_45, week_46, week_47, week_48, week_49, week_50,
        week_51, week_52} = req.body;
    const query = `select 
    week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10, week_11, week_12, week_13, week_14, week_15, week_16, week_17, week_18, week_19, week_20,
    week_21, week_22, week_23, week_24, week_25, week_26, week_27, week_28, week_29, week_30,
    week_31, week_32, week_33, week_34, week_35, week_36, week_37, week_38, week_39, week_40,
    week_41, week_42, week_43, week_44, week_45, week_46, week_47, week_48, week_49, week_50,
    week_51, week_52
    from carrier_allocation_new where ca_id = ${ca_id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ ca_id: data, message: 'weekwise fetch successful' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//search allocation by id
const searchAllocationById = async (req, res) => {
    const id= req.params['id'] ;
    let query = `select * from carrier_allocation_new where ca_id=${id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            console.log('query::',query)
            res.status(OK).send({ data: data.rows, totalUsers: data.rows.length, message: 'Allocation data fetched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//search allocation by column
const searchAllocationLike = async (req, res) => {
    const {origin, destination} = req.body;
    let query = `select * from carrier_allocation_new where "origin" like N'%${origin}%' and  "destination" like N'%${destination}%'`;
    // let query = `select * from carrier_allocation_new where "origin" like N'%${origin}%' and  "destination" like N'%${destination}%' and  "sailing" like N'%${sailing}%' `;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            console.log('query::',query)
            res.status(OK).send({ data: data.rows, totalUsers: data.rows.length, message: 'Allocation data fetched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};


module.exports = {
    carrierAllocationNew,
    fetchAllCarrierAllocation,
    fetchWeekAllocation,
    onLoadCarrierAllocation,
    updateCarrierAllocation,
    updateTargetValues,
    deleteTargetValues,
    downloadExcel,
    searchAllocationById,
    searchAllocationLike,
};