require('dotenv').config();
const executeQuery = require('../../db/connect');
const axios = require("axios");
const { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND } = require('../../utils/apiStatus');
const { getCurrentDateTimestamp, getLoggedInUserInfo } = require('../../utils/services/shared.service');
const { sendMail } = require('../../utils/email/email');
const { submitInstruction } = require('../../utils/email/templates/submitInstruction');
const { getCurrentClientData } = require('../dashboard/dashboard.service');
const { kuulieLogo } = require('../../utils/image-constants');
const { BOOKING_STATUS } = require('../../utils/common-constants');


const createInvolvedParty = async (req, partyType, bookingId, party, currentDateTimestamp, userId) => {
    const query = `
    INSERT INTO booking_parties(
        booking_id, party_type, party_id, reference_number, created_on, created_by)
        VALUES (${bookingId}, '${partyType}', ${party.partyId ?? party.party_id}, '${party.referenceNumber}', '${currentDateTimestamp}', '${userId}');
    `;
    const queryResponse = await executeQuery(query, req.dbConnectionString);

    if (queryResponse?.rowCount <= 0) {
        throw Error("Booking created however error ocurred while inserting booking parties.");
    }
}

const updateBookingInsurance = async (req, res) => {
    const bookingId = req.params.bookingId;
    const { coverInsurance, invoiceValue, premiumAmount, isConfirm, quotationRequestId } = req.body;

    try {
        const authUserId = req.user.id;

        const user = await getLoggedInUserInfo(req, res);
        const currentDateTimestamp = getCurrentDateTimestamp();
        const query = `UPDATE "bookings" 
        SET 
        "cover_insurance" = ${coverInsurance || false},
        "invoice_value" = ${invoiceValue || 0},
        "premium_amount" = '${premiumAmount || 0}',
        "updated_by" = '${user.user_id}',
        "updated_on" = '${currentDateTimestamp}' WHERE id = ${bookingId}`;

        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse.rowCount > 0) {
            if (isConfirm) {

                const quotationRequestUpdateQuery = `UPDATE quotation_requests SET "isSentSI" = true WHERE id = ${quotationRequestId};`;
                const quotationRequestUpdateQueryResponse = await executeQuery(quotationRequestUpdateQuery, req.dbConnectionString);

                const quotationRequestQuery = `SELECT * FROM quotation_requests WHERE id = ${quotationRequestId};`;
                const quotationRequestQueryResponse = await executeQuery(quotationRequestQuery, req.dbConnectionString);

                if (quotationRequestQueryResponse?.rowCount > 0 && quotationRequestUpdateQueryResponse?.rowCount > 0) {
                    const quotation = quotationRequestQueryResponse.rows[0];

                    const carriageMainQuery = `INSERT INTO booking_carriages_main(
                        booking_id, main_port_of_load, main_port_of_discharge, created_on, created_by)
                        VALUES (${bookingId}, '${quotation.origin}', '${quotation.destination}', '${currentDateTimestamp}', '${authUserId}');`;
                    const carriageMainQueryResponse = await executeQuery(carriageMainQuery, req.dbConnectionString);

                    if (carriageMainQueryResponse?.rowCount > 0) {
                        res.status(OK).send({});
                        const clientId = req?.user?.client?.id
                        const userAdminData = await axios.get(`${process.env.AUTH_API_URL}/api/users/admins/${clientId}`,
                            { headers: { Authorization: req.headers.authorization } });
                        const data = userAdminData?.data?.data;
                        const mailAdminBodyHTML = submitInstruction(bookingId);
                        const clientData = await getCurrentClientData(req);
                        const attachments = [
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
                        for (const element of data) {
                            adminEmailId = element.email
                            await sendMail(
                                [adminEmailId],
                                "Kuulie | Submit Instruction",
                                mailAdminBodyHTML,
                                "",
                                attachments
                            );
                        }
                        return;
                    }
                }
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating booking." });
            } else {
                res.status(OK).send({});
            }
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating booking insurance." });
        }
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error?.message || "Error while updating booking insurance." });
    }
}

const saveAndConfirmBooking = async (req, res) => {
    const bookingId = req.params.booking_id;
    const { masterBl, isConfirm } = req.body;

    try {
        const user = await getLoggedInUserInfo(req, res);
        const currentDateTimestamp = getCurrentDateTimestamp();

        const query = `UPDATE "bookings" 
        SET 
        "masterBl" = '${masterBl}', 
        ${isConfirm ? ' status = \'' + BOOKING_STATUS.CONFIRMED + '\', ' : ''}
        "updated_by" = '${user.user_id}',
        "updated_on" = '${currentDateTimestamp}' WHERE id = ${bookingId}`;

        const queryResponse = await executeQuery(query, req.dbConnectionString);

        if (queryResponse.rowCount > 0) {
            res.status(OK).send({});
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating booking." });
        }
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error?.message || "Error while updating booking." });
    }
}

const createBooking = async (req, res) => {
    const { creatorsRole, partiesInvolved, quotationRequestId, status } = req.body;
    let { bookingId } = req.body;
    const authUserId = req.user.id;

    try {
        let queryResponse;
        const user = await getLoggedInUserInfo(req, res);
        const currentDateTimestamp = getCurrentDateTimestamp();
        if (!bookingId) {
            const query = `
                            INSERT INTO bookings(
                            creators_role, quotation_request_id, status, created_on, created_by)
                            VALUES ('${creatorsRole}', ${quotationRequestId}, '${status}', '${currentDateTimestamp}', '${authUserId}')
                            RETURNING id;
                            `;
            queryResponse = await executeQuery(query, req.dbConnectionString);
        }
        if (queryResponse?.rowCount > 0 || bookingId) {
            if (!bookingId) {
                bookingId = queryResponse.rows[0].id;
            }
            if (partiesInvolved) {

                const deletedBookingPartiesQuery = `DELETE FROM booking_parties WHERE party_type != 'Customer' AND booking_id = ${bookingId}`;
                await executeQuery(deletedBookingPartiesQuery, req.dbConnectionString);

                if ((req?.user?.role === "CUSTOMER")) {
                    const partyType = 'Customer';
                    await createInvolvedParty(req, partyType, bookingId, { partyId: user.user_id, referenceNumber: "" }, currentDateTimestamp, authUserId);
                }

                if (Object.keys(partiesInvolved.forwarder || {}).length > 0) {
                    const forwarderParty = partiesInvolved.forwarder;
                    const partyType = 'Forwarder';
                    await createInvolvedParty(req, partyType, bookingId, forwarderParty, currentDateTimestamp, authUserId);
                }
                if (Object.keys(partiesInvolved.shipper || {}).length > 0) {
                    const partyType = 'Shipper';

                    const shipperParty = partiesInvolved.shipper;
                    await createInvolvedParty(req, partyType, bookingId, shipperParty, currentDateTimestamp, authUserId);
                }
                if (Object.keys(partiesInvolved.consignee || {}).length > 0) {
                    const partyType = 'Consignee';

                    const consigneeParty = partiesInvolved.consignee;
                    await createInvolvedParty(req, partyType, bookingId, consigneeParty, currentDateTimestamp, authUserId);
                }
                if (Object.keys(partiesInvolved.contractParty || {}).length > 0) {
                    const partyType = 'Contract Party';

                    const contractParty = partiesInvolved.contractParty;
                    await createInvolvedParty(req, partyType, bookingId, contractParty, currentDateTimestamp, authUserId);
                }
                if (partiesInvolved.notifyParty.length > 0) {
                    const partyType = 'NotifyParty';
                    const notifyPartyObj = partiesInvolved.notifyParty;
                    for (let i = 0; i < notifyPartyObj.length; i++) {
                        await createInvolvedParty(req, partyType, bookingId, notifyPartyObj[i], currentDateTimestamp, authUserId);
                    }
                }
            }
            return res.status(OK).json(bookingId);
        }
        else {
            console.log(queryResponse)
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while creating booking." });
        }
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while creating booking." });
    }
}

const createHaulage = async (req, res) => {
    const { bookingId, contactId, emptyPickupDate, emptyPickupTime, pickupDate } = req.body;
    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });
    try {
        const currentDateTimestamp = getCurrentDateTimestamp();
        const user = await getLoggedInUserInfo(req, res);
        const query = `
        INSERT INTO booking_haulages(
            booking_id, contact_id, empty_pickup_date, empty_pickup_time, created_on, created_by,pickup_date)
            VALUES (${bookingId}, ${contactId}, '${emptyPickupDate}', '${emptyPickupTime}', '${currentDateTimestamp}', '${user.user_id}','${pickupDate}')
            RETURNING id;
        `;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse?.rowCount > 0) {
            return res.status(OK).json({ message: "Booking haulage added successfully." });
        } else {
            console.log(queryResponse)
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding booking haulage." });
        }
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking haulage." });
    }
}

const createContainers = async (req, res) => {
    const { bookingId, containers } = req.body;
    const authUserId = req.user.id;

    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });
    try {

        if (!containers || containers.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "containers information required." })
        }

        if (!bookingId) {
            return res.status(BAD_REQUEST).json({ message: "bookingId information required." })
        }

        const currentDateTimestamp = getCurrentDateTimestamp();

        const deletedBookingContainersQuery = `
            DELETE FROM booking_container_commodity_cartons WHERE booking_container_commodity_id IN(SELECT id FROM booking_container_commodities WHERE booking_id = ${bookingId});
            DELETE FROM booking_container_commodities WHERE booking_id = ${bookingId};
            DELETE FROM booking_containers WHERE booking_id = ${bookingId};        
        `;
        await executeQuery(deletedBookingContainersQuery, req.dbConnectionString);


        for (let i = 0; i < containers?.length; i++) {
            const container = containers[i];
            const containerQuery = `
            INSERT INTO booking_containers(
                booking_id, container_type, cargo, weight, created_on, created_by,marks_and_number,container_number,seal_number,hbl_number,mbl_number)
                VALUES (${bookingId}, '${container.containerType || ""}', '${container.cargo || ""}', ${container.weight || 0}, '${currentDateTimestamp}', '${authUserId}','${container.marksAndNumber || ""}','${container.containerNumber || ""}',
                '${container.sealNumber || ""}','${container.hblNumber || ""}','${container.mblNumber || ""}' )
            RETURNING id;
            `;
            const containerQueryResponse = await executeQuery(containerQuery, req.dbConnectionString);
            if (containerQueryResponse?.rowCount > 0) {
                const commodities = container.commodities || [];
                const bookingContainerId = containerQueryResponse?.rows[0].id;
                for (let j = 0; j < commodities?.length; j++) {
                    const commodity = commodities[j];
                    const containerCommodityQuery = `
                    INSERT INTO booking_container_commodities(
                        booking_container_id, cargo_description, hs_code, cargo_weight, gross_volume, is_cargo_hazardous, additional_info, created_on, created_by,
                        marks_and_number, container_number, seal_number, booking_id)
                        VALUES (${bookingContainerId}, '${commodity.cargoDescription}', '${commodity.hsCode}', ${commodity.cargoWeight}, ${commodity.grossVolume},
                         ${commodity.isCargoHazardous}, '${commodity.additionalInfo}', '${currentDateTimestamp}', '${authUserId}', '${container.marksAndNumber}',
                         '${container.containerNumber}', '${container.sealNumber}', ${bookingId})
                    RETURNING id;
                    `;
                    const containerCommodityQueryResponse = await executeQuery(containerCommodityQuery, req.dbConnectionString);

                    if (containerCommodityQueryResponse?.rowCount > 0) {
                        const bookingContainerCommodityId = containerCommodityQueryResponse?.rows[0].id;
                        const cartons = commodity.cartons || [];

                        for (let k = 0; k < cartons?.length; k++) {
                            const carton = cartons[k];
                            const commodityCartonQuery = `
                            INSERT INTO booking_container_commodity_cartons(
                                booking_container_commodity_id, length, width, height, no_of_cartons, created_on, created_by, "grossWeight")
                                VALUES (${bookingContainerCommodityId}, ${carton.length}, ${carton.width}, ${carton.height}, ${carton.noOfCartons}, '${currentDateTimestamp}', '${authUserId}', ${carton.cargoWeight})
                            RETURNING id;
                            `;

                            const commodityCartonQueryResponse = await executeQuery(commodityCartonQuery, req.dbConnectionString);

                            if (commodityCartonQueryResponse?.rowCount <= 0) {
                                console.log("commodityCartonQueryResponse ----- ", commodityCartonQueryResponse);
                                throw Error("Error ocurred while inserting carton.");
                            }
                        }

                    } else {
                        console.log("containerCommodityQueryResponse ----- ", containerCommodityQueryResponse);
                        throw Error("Error ocurred while inserting commodity.");
                    }
                }
            } else {
                console.log("containerQueryResponse ----- ", containerQueryResponse);
                throw Error("Error ocurred while inserting container.");
            }
        }
        return res.status(OK).json({ message: "Booking container added successfully." });
    } catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking haulage." });
    }
}

const createCarriage = async (req, res) => {
    const { bookingId, preStartLocation, preEndLocation, preEtd, preEta,
        preMode, mainCarriage, postStartLocation, postEndLocation, postEtd, postEta, postMode
    } = req.body;
    const authUserId = req.user.id;

    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });

    try {

        const currentDateTimestamp = getCurrentDateTimestamp();

        const deletedBookingContainersQuery = `
            DELETE FROM booking_carriages WHERE booking_id = ${bookingId};
            DELETE FROM booking_carriages_main WHERE booking_id = ${bookingId};
            `;

        await executeQuery(deletedBookingContainersQuery, req.dbConnectionString);

        const carriageQuery = `INSERT INTO booking_carriages(
            booking_id, pre_start_location, pre_end_location, pre_etd, pre_eta, pre_mode,
            post_start_location, post_end_location, post_etd, post_eta, post_mode, created_on,
            created_by)
            VALUES (${bookingId}, '${preStartLocation}', '${preEndLocation}', '${preEtd}', '${preEta}',
            '${preMode}', '${postStartLocation}', '${postEndLocation}', '${postEtd}', '${postEta}', 
            '${postMode}', '${currentDateTimestamp}', '${authUserId}');`;

        const carriageQueryQueryResponse = await executeQuery(carriageQuery, req.dbConnectionString);
        if (carriageQueryQueryResponse?.rowCount > 0) {
            for (let i = 0; i < mainCarriage.length; i++) {
                const { mainPortOfLoad, mainPortOfDischarge, mainEtd, mainEta, mainVessel, mainVoyage } = mainCarriage[i];
                const carriageMainQuery = `INSERT INTO booking_carriages_main(
                    booking_id, main_port_of_load, main_port_of_discharge, main_etd, main_eta, main_vessel,
                    main_voyage, created_on, created_by)
                    VALUES (${bookingId}, '${mainPortOfLoad}', '${mainPortOfDischarge}', '${mainEtd}', '${mainEta}',
                    ${mainVessel}, ${mainVoyage}, '${currentDateTimestamp}', '${authUserId}');`;
                await executeQuery(carriageMainQuery, req.dbConnectionString);
            }
            res.status(OK).json({ message: "Booking carriage added successfully." });
        }
        else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding booking carriage." });
        }
    }
    catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking carriage." });
    }
}

const createPayment = async (req, res) => {
    const {
        bookingId,
        payment } = req.body;

    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });
    const currentDateTimestamp = getCurrentDateTimestamp();
    const authUserId = req.user.id;

    try {
        const deleteQuery = `
        DELETE FROM booking_payments WHERE booking_id = ${bookingId};
        `;
        await executeQuery(deleteQuery, req.dbConnectionString);

        for (let i = 0; i < payment.length; i++) {
            const { chargeType, paymentTerm, payer, paymentLocation } = payment[i];

            const query = `INSERT INTO booking_payments(
                booking_id, charge_type, payment_term, payer, payment_location, created_on, created_by)
                VALUES ('${bookingId}', '${chargeType}', '${paymentTerm}', '${payer}', '${paymentLocation}','${currentDateTimestamp}', '${authUserId}');`;

            const queryResponse = await executeQuery(query, req.dbConnectionString);
            if (queryResponse.rowCount == 0) {
                return res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking payment." });
            }
        }
        return res.status(OK).json({ message: "Payment added successfully." });
    }
    catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking payment." });
    }
}

const createNotification = async (req, res) => {
    const { bookingId, customerComment, emailIds } = req.body;
    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });
    const authUserId = req.user.id;
    let emailIdsArray = emailIds.split(";");
    try {
        const currentDateTimestamp = getCurrentDateTimestamp();

        const deleteQuery = `
        DELETE FROM booking_notifications WHERE booking_id = ${bookingId};
        `;
        await executeQuery(deleteQuery, req.dbConnectionString);

        if (emailIdsArray.length > 0) {
            for (let i = 0; i < emailIdsArray.length; i++) {
                const query = `INSERT INTO booking_notifications(
                    booking_id, customer_comment, email_ids, created_on, created_by)
                    VALUES ('${bookingId}', '${customerComment}', '${emailIdsArray[i]}','${currentDateTimestamp}', '${authUserId}');`;

                const queryResponse = await executeQuery(query, req.dbConnectionString);
                if (queryResponse.rowCount) {
                    const fileName = "Booking.pdf";
                    const mailBodyHTML = `
                      Hi ,<br/>
                        We have confirmed your booking.
                        Your reference number is ${bookingId}.
                        <br/>
                        <b>
                      Thanks and Regards,<br/>
                      The Kuulie Team
                      </b>
                    `;
                    const attachments = [{
                        filename: fileName,
                    },];
                    const isMailSent = await sendMail(emailIds, "Kuulie | Bookings", mailBodyHTML, '', attachments);
                    if (isMailSent) {
                        console.log("Email sent successfully");
                    } else {
                        return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while sending Booking email" });
                    }
                }
            }
            return res.status(OK).send({ message: "Notification saved and Email sent to given Email Id." });
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while sending Booking email" });
    }
    catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding booking payment." });
    }
}

const createTemplate = async (req, res) => {
    const { bookingId, name } = req.body;
    if (!bookingId) res.status(INTERNAL_SERVER_ERROR).send({ message: "Booking Id is not given." });
    const currentDateTimestamp = getCurrentDateTimestamp();
    const user = await getLoggedInUserInfo(req, res);
    try {
        const query = `INSERT INTO booking_templates(
            name, booking_id, created_on, created_by)
            VALUES ('${name}', ${bookingId}, '${currentDateTimestamp}', '${user.user_id}');`;
        console.log("query", query);
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse?.rowCount > 0) {
            return res.status(OK).json({ message: "Booking Template added successfully." });
        }
        else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding template in booking." });
        }
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error || "Error while adding template in booking." });
    }
}

const getBookingInfo = async (req, res) => {
    try {
        const getBookingDataQuery = `SELECT 
	bg.main_port_of_load,
	bg.main_port_of_discharge,
	COUNT(*) as no_of_bookings,
	SUM(bg.no_of_containers) as no_of_containers,
	SUM(bg.total_weight) as total_weight
FROM (
	SELECT * FROM bookings b
		INNER JOIN booking_carriages_main bcm ON b.id = bcm.booking_id AND bcm.main_port_of_load != '' AND bcm.main_port_of_discharge != ''
		INNER JOIN (
			SELECT booking_id, COUNT(*) as no_of_containers, SUM(weight) as total_weight FROM booking_containers GROUP BY booking_id
		) as bc ON b.id = bc.booking_id
) as bg GROUP BY bg.main_port_of_load, bg.main_port_of_discharge;`;
        console.log("getBookingDataQuery", getBookingDataQuery);
        const getBookingDataQueryResponse = await executeQuery(getBookingDataQuery, req.dbConnectionString);
        let responseData = getBookingDataQueryResponse.rows;
        res.status(OK).json(responseData);
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error While fetching Data." });
    }
}

const getBookingDataByPort = async (req, res) => {
    const { portOfLoading, portOfDischarge } = req.body;
    try {
        const getDataByPortsQuery = `SELECT
            bd.*, c.firstname, c.lastname FROM (
                SELECT 
                bg.party_id,
                COUNT(*) as no_of_bookings,
                SUM(bg.no_of_containers) as no_of_containers,
                SUM(bg.total_weight) as total_weight
                    FROM (
                        SELECT * FROM bookings b
                        INNER JOIN booking_carriages_main bcm ON b.id = bcm.booking_id AND bcm.main_port_of_load = '${portOfLoading}' AND bcm.main_port_of_discharge = '${portOfDischarge}'
                        INNER JOIN booking_parties bp ON b.id = bp.booking_id AND (party_type = 'Forwarder' OR party_type = 'Customer')
                        INNER JOIN (
                            SELECT booking_id, COUNT(*) as no_of_containers, SUM(weight) as total_weight FROM booking_containers GROUP BY booking_id
                            ) as bc ON b.id = bc.booking_id
                        ) as bg GROUP BY bg.party_id
                    ) as bd
            INNER JOIN customer_details c ON bd.party_id = c.customer_id;`;

        const getDataByPortsQueryResponse = await executeQuery(getDataByPortsQuery, req.dbConnectionString);

        let responseData = getDataByPortsQueryResponse.rows;
        if (responseData) {
            res.status(OK).json(responseData);
        }
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching Data." });
    }
}

const getIndivisualBookingByPort = async (req, res) => {
    const { portOfLoading, portOfDischarge, partyId } = req.body
    try {
        const getIndivisualBookingByPortQuery = `SELECT * FROM bookings b
        INNER JOIN booking_carriages_main bcm ON b.id = bcm.booking_id AND bcm.main_port_of_load = '${portOfLoading}' AND bcm.main_port_of_discharge = '${portOfDischarge}'
		INNER JOIN booking_parties bp ON b.id = bp.booking_id AND (bp.party_type = 'Forwarder' OR bp.party_type = 'Customer') AND bp.party_id = '${partyId}';`
        const getIndivisualBookingByPortQueryResponse = await executeQuery(getIndivisualBookingByPortQuery, req.dbConnectionString);
        console.log('getIndivisualBookingByPortQueryResponse: ', getIndivisualBookingByPortQueryResponse);
        let responseData = getIndivisualBookingByPortQueryResponse.rows;
        console.log('responseData', responseData);
        res.status(OK).json(responseData);
    }
    catch (error) {
        res(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching Data." });
    }
}

const getBookingDataById = async (req, res) => {
    const { booking_id } = req.params;
    try {
        const getBookingDataByIdQuery = ` SELECT * FROM bookings WHERE id = ${booking_id}`;
        const getBookingDataByIdQueryResponse = await executeQuery(getBookingDataByIdQuery, req.dbConnectionString);

        const bookingPartiesQuery = `SELECT * FROM booking_parties bp          
        INNER JOIN customer_details cd on cd.customer_id = bp.party_id AND booking_id = ${booking_id};`;
        const bookingPartiesQueryResponse = await executeQuery(bookingPartiesQuery, req.dbConnectionString);

        const bookingCarriageQuery = `SELECT * FROM booking_carriages WHERE booking_id = ${booking_id}`
        const carriageQueryResponse = await executeQuery(bookingCarriageQuery, req.dbConnectionString);

        const bookingCarriageMainQuery = `SELECT * FROM booking_carriages_main WHERE booking_id = ${booking_id}`
        const carriageMainQueryResponse = await executeQuery(bookingCarriageMainQuery, req.dbConnectionString);

        const carriageData = carriageQueryResponse?.rows?.length > 0 ? carriageQueryResponse.rows[0] : {};

        const carriage = {
            preStartLocation: carriageData.pre_start_location,
            preEndLocation: carriageData.pre_end_location,
            preEtd: carriageData.pre_etd,
            preEta: carriageData.pre_eta,
            preMode: carriageData.pre_mode,
            postStartLocation: carriageData.post_start_location,
            postEndLocation: carriageData.post_end_location,
            postEtd: carriageData.post_etd,
            postEta: carriageData.post_eta,
            postMode: carriageData.post_mode,
            mainCarriage: carriageMainQueryResponse?.rows?.length > 0 ? carriageMainQueryResponse?.rows?.map(row => ({
                mainVessel: row.main_vessel,
                mainVoyage: row.main_voyage,
                mainPortOfLoad: row.main_port_of_load,
                mainPortOfDischarge: row.main_port_of_discharge
            })) : [{}]
        };

        let partiesInvolved = { notifyParty: [] };

        for (i = 0; i < bookingPartiesQueryResponse?.rows?.length; i++) {
            const party = bookingPartiesQueryResponse.rows[i];
            if (party.party_type === 'NotifyParty') {
                partiesInvolved.notifyParty.push(party);
            } else {
                const mapKey = party.party_type === 'Contract Party' ? 'contractParty' : party.party_type?.toLowerCase();
                partiesInvolved[mapKey] = party;
            }
        }

        const containersQuery = `SELECT * FROM booking_containers WHERE booking_id = ${booking_id}`
        const containersQueryResponse = await executeQuery(containersQuery, req.dbConnectionString);

        const containerPromises = containersQueryResponse?.rows?.map(async (c) => {
            const commoditiesQuery = `SELECT * FROM booking_container_commodities WHERE booking_container_id = ${c.id}`
            const commoditiesQueryResponse = await executeQuery(commoditiesQuery, req.dbConnectionString);

            const commoditiesPromises = commoditiesQueryResponse?.rows?.map(async m => {
                const cartonsQuery = `SELECT * FROM booking_container_commodity_cartons WHERE booking_container_commodity_id = ${m.id}`
                const cartonsQueryResponse = await executeQuery(cartonsQuery, req.dbConnectionString);

                const cartons = cartonsQueryResponse?.rows?.map((ccc, index) => {
                    const grossVolume = parseFloat(((parseFloat(ccc.length) * parseFloat(ccc.width) * parseFloat(ccc.height)) / 1000000) * parseFloat(ccc.no_of_cartons));

                    return {
                        length: ccc.length,
                        width: ccc.width,
                        height: ccc.height,
                        noOfCartons: ccc.no_of_cartons,
                        key: index + 1,
                        grossVolume,
                        cargoWeight: ccc.grossWeight
                    }
                });

                const commodity = {
                    cartons,
                    cargoDescription: m.cargo_description,
                    hsCode: m.hs_code,
                    cargoWeight: m.cargo_weight,
                    grossVolume: m.gross_volume,
                    isCargoHazardous: m.is_cargo_hazardous,
                    additionalInfo: m.additional_info,
                    marksAndNumber: m.marks_and_number,
                    containerNumber: m.container_number,
                    sealNumber: m.seal_number,
                }
                return commodity;
            });

            const container = {
                commodities: await Promise.all(commoditiesPromises),
                containerType: c.container_type,
                cargo: c.cargo,
                weight: c.weight,
                marksAndNumber: c.marks_and_number,
                containerNumber: c.container_number,
                sealNumber: c.seal_number,
                hblNumber: c.hbl_number,
                mblNumber: c.mbl_number,
            }

            return container;
        });

        const containers = await Promise.all(containerPromises);

        let responseData = {
            containers,
            booking: getBookingDataByIdQueryResponse.rows[0],
            "id": { id: getBookingDataByIdQueryResponse.rows[0].id },
            partiesInvolved,
            carriage
        }
        res.status(OK).json(responseData);
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching Data." });
    }
}

const getBookingsByStatus = async (req, res) => {
    const status = req.params.status;
    const authUserId = req.user.id;

    try {
        const query = `
        SELECT * FROM 
        (
            SELECT * FROM bookings WHERE created_by = '${authUserId}' AND status = '${status}' ORDER BY created_on DESC) b
            INNER JOIN
            (SELECT * FROM
                    (
                        SELECT * FROM
                        "quotation_requests" q
                            INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id AND cd.auth_user_id = '${authUserId}' AND q.status ='ACCEPTED'
                    ) qr
                    LEFT JOIN
                    (
                    SELECT mq.id as mq_id, mq.my_quotation_id as quotation_uid, mq.quotation_rate_output_id,mq.total_amount,qro.validity_date_from,
                    qro.validity_date_to, qro.carrier FROM "my_quotations" mq
                        INNER JOIN  "quotation_rate_output" qro
                    ON qro.quotation_rate_output_id = mq.quotation_rate_output_id
                    ) mqro
                    ON mqro.mq_id = qr.my_quotation_id
                    ORDER BY qr.created_on DESC
            ) q
        ON b.quotation_request_id = q.id;
        `;

        const queryResponse = await executeQuery(query, req.dbConnectionString);

        res.status(OK).send({ data: queryResponse?.rows || [] });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports = {
    createBooking,
    createHaulage,
    createContainers,
    createCarriage,
    createPayment,
    createNotification,
    createTemplate,
    getBookingInfo,
    getBookingDataByPort,
    getIndivisualBookingByPort,
    getBookingDataById,
    updateBookingInsurance,
    saveAndConfirmBooking,
    getBookingsByStatus
}