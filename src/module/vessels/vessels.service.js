require('dotenv').config();
const moment = require('moment')
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');

const createVessel = async (req, res) => {
    const authUserId = req.user.id;
    const {
        name,
        imo,
        vesselTypeGeneric,
        vesselTypeDetailed,
        mmsi,
        callSign,
        flag,
        yearBuilt,
        homePort,
        grossTonnage,
        summerDWT,
        lengthOverall,
        breadthExtreme,
        nominalCapacity,
        breakdownInCapacity,
        active
    } = req.body;

    const image = req.file ? req.file.key : null;
    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

    if (user && user.user_id) {
        const createVesselQuery = `INSERT INTO "vessels" ("name", "imo", "vessel_type_generic", "vessel_type_detailed",
        "mmsi", "call_sign", "flag", "year_built", "home_port", "gross_tonnage", "summer_dwt",
        "length_overall", "breadth_extreme", "nominal_capacity", "breakdown_in_capacity", "image", "active", "created_on", "created_by", "updated_on",
        "updated_by")
        VALUES ('${name}', '${imo}','${vesselTypeGeneric}', '${vesselTypeDetailed}', '${mmsi}',
         '${callSign}', '${flag}', '${yearBuilt}', '${homePort}','${grossTonnage}', 
         '${summerDWT}', '${lengthOverall}', '${breadthExtreme}', '${nominalCapacity}', '${breakdownInCapacity}',
          '${image}', ${active}, '${currentDateTimestamp}', '${user.user_id}', NULL, NULL) RETURNING id;`;

        try {
            const createVesselQueryResponse = await executeQuery(createVesselQuery, req.dbConnectionString);

            if (createVesselQueryResponse?.rowCount > 0) {
                res.status(OK).send({ message: 'Vessel Successfully added.' });
            }
            else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding vessel." });
            }
        } catch (err) {
            console.log(err)
            res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while adding vessel." });
        }
    }
}

const getVesselList = async (req, res) => {
    try {
        const vesselListQuery = `SELECT * FROM vessels WHERE active = true ORDER BY id DESC;`;
        const vesselListQueryResponse = await executeQuery(vesselListQuery, req.dbConnectionString);

        const data = vesselListQueryResponse.rows.map((row) => ({
            id: row.id,
            name: row.name,
            imo: row.imo,
            vesselTypeGeneric: row.vessel_type_generic,
            vesselTypeDetailed: row.vessel_type_detailed,
            mmsi: row.mmsi,
            callSign: row.call_sign,
            flag: row.flag,
            yearBuilt: row.year_built,
            homePort: row.home_port,
            grossTonnage: row.gross_tonnage,
            summerDWT: row.summer_dwt,
            lengthOverall: row.length_overall,
            breadthExtreme: row.breadth_extreme,
            nominalCapacity: row.nominal_capacity,
            breakdownInCapacity: row.breakdown_in_capacity,
            image: row.image,
            active: row.active,
            createdOn: row.created_on,
            createdBy: row.created_by,
            updatedOn: row.updated_on,
            updatedBy: row.updated_by,
        }));

        return res.status(OK).json({ data });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while fetching vessels." });
    }
}

const getVesselById = async (req, res) => {
    const { id } = req.params;
    try {
        const getVesselByIdQuery = `select * from vessels where id = '${id}';`;
        const getVesselByIdQueryResponse = await executeQuery(getVesselByIdQuery, req.dbConnectionString);
        if (getVesselByIdQueryResponse?.rows?.length > 0) {
            const row = getVesselByIdQueryResponse.rows[0];
            const data = {
                id: row.id,
                name: row.name,
                imo: row.imo,
                vesselTypeGeneric: row.vessel_type_generic,
                vesselTypeDetailed: row.vessel_type_detailed,
                mmsi: row.mmsi,
                callSign: row.call_sign,
                flag: row.flag,
                yearBuilt: row.year_built,
                homePort: row.home_port,
                grossTonnage: row.gross_tonnage,
                summerDWT: row.summer_dwt,
                lengthOverall: row.length_overall,
                breadthExtreme: row.breadth_extreme,
                nominalCapacity: row.nominal_capacity,
                breakdownInCapacity: row.breakdown_in_capacity,
                image: row.image,
                active: row.active,
                createdOn: row.created_on,
                createdBy: row.created_by,
                updatedOn: row.updated_on,
                updatedBy: row.updated_by,
            };
            return res.status(OK).json(data);
        }
        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching vessel detail." });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while fetching vessel detail." });
    }
}

const updateVesselById = async (req, res) => {
    const authUserId = req.user.id;
    const { id } = req.params;
    const {
        name,
        imo,
        vesselTypeGeneric,
        vesselTypeDetailed,
        mmsi,
        callSign,
        flag,
        yearBuilt,
        homePort,
        grossTonnage,
        summerDWT,
        lengthOverall,
        breadthExtreme,
        nominalCapacity,
        breakdownInCapacity,
        image,
        active
    } = req.body;

    const updatedImage = req.file ? req.file.key : image;

    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

    if (user && user.user_id) {
        const updateVesselQuery = `UPDATE "vessels" SET name = '${name}', imo = '${imo}', vessel_type_generic = '${vesselTypeGeneric}', vessel_type_detailed = '${vesselTypeDetailed}', mmsi = '${mmsi}',
        call_sign = '${callSign}', flag = '${flag}', year_built = '${yearBuilt}', home_port = '${homePort}', gross_tonnage = '${grossTonnage}', 
        summer_dwt = '${summerDWT}', length_overall = '${lengthOverall}', breadth_extreme = '${breadthExtreme}', nominal_capacity = '${nominalCapacity}', breakdown_in_capacity = '${breakdownInCapacity}',
        image = '${updatedImage}', active = ${active}, updated_on = '${currentDateTimestamp}', updated_by = '${user.user_id}' WHERE id = ${id};`;
        try {
            const updateVesselQueryResponse = await executeQuery(updateVesselQuery, req.dbConnectionString);

            if (updateVesselQueryResponse?.rowCount > 0) {
                res.status(OK).send({ message: 'Vessel updated successfully.' });
            } else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating vessel." });
            }
        } catch (err) {
            console.log(err);
            res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while updating vessel." });
        }
    }
}


const deleteVessel = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `UPDATE "vessels" SET active = false WHERE id = ${id};`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse?.rowCount > 0) {
            return res.status(OK).json({ message: "Vessel deleted successfully." });
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while deleting vessels." });
        }
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while deleting vessels." });
    }
}

module.exports = {
    createVessel,
    getVesselList,
    getVesselById,
    updateVesselById,
    deleteVessel
}