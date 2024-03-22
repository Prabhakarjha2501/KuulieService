require('dotenv').config();
const moment = require('moment');
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');

const createVoyage = async (req, res) => {
    const authUserId = req.user.id;
    const {
        vesselId, port, numberOfPort, firstPort, lastPort, portType, eta, etb, etd, terminalContainerAddress1, terminalCity,
        terminalState, terminalCountry, terminalZipcode, containerPickUpAddressLine1, containerPickUpCity,
        containerPickUpState, containerPickUpCountry, containerPickUpZipcode, terminalETA, latestGateIn,
        vgmDeadline, customsClearance, freeTime, containerPickUpDate
    } = req.body;

    const status = 'On Track';
    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    const currentDate = moment(new Date()).format('YYYY-MM-DD');

    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
    if (user && user.user_id) {
        //Entry to the voyage table should be insert only if we create new voyage, otherwise do not insert to voyages.
        let voyageId;
        const checkVoyageExistsQuery = `select * from voyages where vessel_id = ${vesselId};`;
        const checkVoyageExistsQueryResponse = await executeQuery(checkVoyageExistsQuery, req.dbConnectionString);

        try {
            if (checkVoyageExistsQueryResponse?.rowCount == 0) {
                const createVoyageQuery = `INSERT INTO voyages(
                    status, vessel_id, created_on, created_by, updated_on, updated_by)
                    VALUES ( '${status}', ${vesselId}, '${currentDateTimestamp}', '${user.user_id}', NULL, NULL) RETURNING voyage_id;`;

                const createVoyageQueryResponse = await executeQuery(createVoyageQuery, req.dbConnectionString);
                voyageId = createVoyageQueryResponse.rows[0].voyage_id;
            } else {
                voyageId = checkVoyageExistsQueryResponse.rows[0].voyage_id;
            }

            const createVoyagePortsQuery = `INSERT INTO voyages_ports(
                voyage_id, port, number_of_ports, first_port, last_port, port_type, eta, etb, etd, terminal_address_line1,
                terminal_city, terminal_state, terminal_country, terminal_zipcode, container_pickup_address_line1,
                container_pickup_city, container_pickup_state, container_pickup_country, container_pickup_zipcode,
                terminal_eta, latest_gatein, vgm_deadline, customs_clearence, free_time, container_pickup_date, created_on,
                created_by, updated_on, updated_by)
                VALUES ( ${voyageId},'${port}', ${numberOfPort}, '${firstPort}', '${lastPort}', '${portType}', '${eta}', '${etb}', '${etd}',
                '${terminalContainerAddress1}', '${terminalCity}', '${terminalState}', '${terminalCountry}', ${terminalZipcode},
                '${containerPickUpAddressLine1}', '${containerPickUpCity}', '${containerPickUpState}', '${containerPickUpCountry}',
                 ${containerPickUpZipcode}, '${terminalETA}', '${latestGateIn}', '${vgmDeadline}', '${customsClearance}',
                ${freeTime}, '${containerPickUpDate}', '${currentDateTimestamp}', '${user.user_id}', NULL, NULL);`;

            const createVoyagePortsQueryResponce = await executeQuery(createVoyagePortsQuery, req.dbConnectionString);

            if (createVoyagePortsQueryResponce?.rowCount > 0) {
                res.status(OK).send({ message: 'Voyage successfully added.' });
            }
            else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding voyage." });
            }
        }
        catch (err) {
            res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while adding voyage." });
        }
    }
}

const getVoyageList = async (req, res) => {
    try {
        const getVoyageListQuery = `select vy.voyage_id, vyp.number_of_ports, vyp.first_port, vyp.last_port, vy.status, vs.name, vy.vessel_id
        from voyages_ports vyp
        INNER JOIN voyages vy
            ON vy.voyage_id = vyp.voyage_id
        INNER JOIN vessels vs
            ON vy.vessel_id = vs.id;`;

        const getVoyageListQueryResponse = await executeQuery(getVoyageListQuery, req.dbConnectionString);
        const data = getVoyageListQueryResponse?.rows?.map((row) => ({
            voyageNumber: row.voyage_id,
            vesselName: row.name,
            vesselId: row.vessel_id,
            numberOfPorts: row.number_of_ports,
            firstPort: row.first_port,
            lastPort: row.last_port,
            voyageStatus: row.status,
        }))
        return res.status(OK).send({ data });
    }
    catch (error) {
        console.log(error);
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while fetching voyages." });
    }
}

const getVoyageById = async (req, res) => {
    const { id } = req.params;
    try {
        const getVoyageByIdQuery = `select * from voyages_ports where voyage_id = ${id};`;
        const getVoyageByIdQueryResponse = await executeQuery(getVoyageByIdQuery, req.dbConnectionString);
        if (getVoyageByIdQueryResponse?.rows?.length > 0) {
            const row = getVoyageByIdQueryResponse.rows[0];
            const data = {
                voyageNumber: row.voyage_id,
                vesselId: row.vessel_id,
                port: row.port,
                portType: row.port_type,
                numberOfPorts: row.number_of_ports,
                firstPort: row.first_port,
                lastPort: row.last_port,
                eta: row.eta,
                etb: row.etb,
                etd: row.etd,
                terminalAddressLine1: row.terminal_address_line1,
                terminalCity: row.terminal_city,
                terminalState: row.terminal_state,
                terminalCountry: row.terminal_country,
                terminalZipcode: row.terminal_zipcode,
                containerPickUpAddressLine1: row.container_pickup_address_line1,
                containerPickUpCity: row.container - pickup_city,
                containerPickUpState: row.container_pickup_state,
                containerPickUpCountry: row.container_pickup_country,
                containerPickUpZipcode: row.container_pickup_zipcode,
                terminalETA: row.terminal_eta,
                latestGateIn: row.latest_gatein,
                vgmDeadLine: row.vgm_deadline,
                customsClearence: row.customs_clearence,
                freeTime: row.free_time,
                containerPickUpDate: row.container_pickup_date,
                status: row.status,
                createdOn: row.created_on,
                createdBy: row.created_by,
                updatedOn: row.updated_on,
                updatedBy: row.updated_by
            };
            return res.status(OK).json(data);
        }
        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching voyage detail." });
    } catch (error) {
        console.log(error);
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while fetching voyage detail." });
    }
}

const getVoyageByVesselIdLoadingAndDestinationPort = async (req, res) => {
    const { vesselId, origin, destination } = req.params;
    try {
        const getVoyageByIdQuery = `select * from voyages where vessel_id = ${vesselId} AND port_of_loading ILIKE '${origin}' AND port_of_destination ILIKE '${destination}';`;
        const getVoyageByIdQueryResponse = await executeQuery(getVoyageByIdQuery, req.dbConnectionString);
        let data = {};
        if (getVoyageByIdQueryResponse?.rows?.length > 0) {
            const row = getVoyageByIdQueryResponse.rows[0];
            data = {
                vesselId: row.vessel_id,
                portOfLoading: row.port_of_loading,
                portOfDestination: row.port_of_destination,
                containerPickupFrom: row.container_pickup_from,
                pickupContainerAddress: row.pickup_container_address,
                pickupCity: row.pickup_city,
                pickupState: row.pickup_state,
                pickupCountry: row.pickup_country,
                pickupZipcode: row.pickup_zipcode,
                pickupEarliestGateIn: row.pickup_earliest_gate_in,
                pickupLatestGateIn: row.pickup_latest_gate_in,
                terminalContainerAddress: row.terminal_container_address,
                terminalCity: row.terminal_city,
                terminalState: row.terminal_state,
                terminalCountry: row.terminal_country,
                terminalZipcode: row.terminal_zipcode,
                siClosing: row.si_closing,
                cyClosing: row.cy_closing,
                vgmDeadline: row.vgm_deadline,
                customsClearance: row.customs_clearance,
                eta: row.eta,
                etd: row.etd,
                ata: row.ata,
                atd: row.atd,
                freeTimeAtOrigin: row.free_time_at_origin,
                freeTimeAtDestination: row.free_time_at_destination,
                demurrageAtDestination: row.demurrage_at_destination,
                detentionAtDestination: row.detention_at_destination,
                freeDropOff: row.free_drop_off,
                paidDropOff: row.paid_drop_off,
                paidDropOffCost: row.paid_drop_off_cost,
                active: row.active,
                createdOn: row.created_on,
                createdBy: row.created_by,
                updatedOn: row.updated_on,
                updatedBy: row.updated_by
            };
        }
        return res.status(OK).json(data);
    } catch (error) {
        console.log(error);
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while fetching voyage detail." });
    }
}

const updateVoyageById = async (req, res) => {
    const authUserId = req.user.id;
    try {
        res.status(OK).json({});
    } catch (error) {
        console.log(error);
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while updating voyage detail." });
    }
}

module.exports = {
    createVoyage,
    getVoyageList,
    getVoyageById,
    updateVoyageById,
    getVoyageByVesselIdLoadingAndDestinationPort
}
