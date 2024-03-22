require('dotenv').config();
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const moment = require('moment');
const { data } = require('../../logger/logger');
const { default: axios } = require('axios');
const { addNotificationAndEmit } = require('../notifications/notifications.service');
const { getQuotationTemplate } = require('../../utils/email/templates/quotation');
const { sendMail } = require('../../utils/email/email');
const { kuulieLogo } = require('../../utils/image-constants');
const { getCurrentClientData } = require('../dashboard/dashboard.service');
const { requestedQuote } = require('../../utils/email/templates/requestedQuote');
const { acceptQuotation } = require('../../utils/email/templates/acceptQuotation');
const { uploadQuotationDocument } = require('../../utils/aws');
const { uploadDocument } = require('../document/document.service');
const { getCustomerRequestFormSubmissionHTML } = require('../../utils/email/templates/customerRequestFormSubmission');

const fetchCustomerDetails = async (req, res) => {
    const query = "SELECT *, c.name as company_name, cd.city as city, cd.country as country FROM customer_details cd LEFT JOIN companies c ON cd.company = c.id AND cd.isdelete != true order by cd.customer_id DESC;";
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ data: data.rows, totalUsers: data.rows.length, message: 'customer data fetched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//update Customer Details PUT
const updateCustomerDetails = async (req, res) => {
    const { customer_id } = req.params;
    const {
        firstname,
        lastname,
        company,
        phone_number,
        primary_emailid,
        city,
        country,
    } = req.body

    const query = `UPDATE customer_details 
            set 
            "firstname" = '${firstname || ''}',
            "lastname" = '${lastname || ''}',
            "company" = '${company}',
            "phone_number" = '${phone_number || ''}',
            "primary_emailid" = '${primary_emailid || ''}',
            "city" = '${city || ''}',
            "country" = '${country || ''}'
            where customer_id=${customer_id}`;
    try {
        const data = await executeQuery(query, req.dbConnectionString);
        if (data && data.rowCount > 0) {
            res.status(OK).send({ message: `customer data updated having customer_id:${customer_id}`, customer_id });
        } else {
            console.log("ERROR - ", data, query)
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating CRM contact." });
        }
    } catch (err) {
        console.log("ERROR - ", err)
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while updating CRM contact." });
    }
}

//delete Customer Details
const deleteCustomerDetails = async (req, res) => {
    const { customer_id } = req.params;
    let query = `Delete from customer_details where customer_id = ${customer_id}`;

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: `delete customer having id:${customer_id}` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//delete customer Details in Bulk
const deleteCustomerDetailsBulk = async (req, res) => {
    const data = req.body;
    const query = `UPDATE customer_details SET isdelete = true WHERE customer_id IN (${data})`;

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ message: `Selected users deleted successfully` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}
//create Customer Details
const createCustomerDetails = async (req, res) => {
    const {
        firstname,
        lastname,
        company,
        phone_number,
        primary_emailid,
        city,
        country,
    } = req.body;
    const query = `INSERT INTO "customer_details" (
        "firstname", "lastname",
        "company", "phone_number",
        "primary_emailid", "city", "country") 
    VALUES ('${firstname}', '${lastname}',
    '${company}', '${phone_number}',
    '${primary_emailid}', '${city}', '${country}') `;
    try {
        const data = await executeQuery(query, req.dbConnectionString);
        if (data && data.rowCount) {
            res.status(OK).send({ message: `CRM contact successfully added.` });
        } else {
            console.log("ERROR - ", query, data);
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding CRM contact." });
        }
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while adding CRM contact." });
    }
}
//update isActive column in customer_details table 
const updateUserStatus = async (req, res) => {
    const { isActive, customerId } = req.params;
    const query = `UPDATE customer_details SET isactive = ${isActive} WHERE customer_id = '${customerId}'`
    try {
        const data = await executeQuery(query, req.dbConnectionString);
        if (data && data.rowCount) {
            res.status(OK).send({ message: `User updated successfully` });
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while updating user status" });
        }
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error occurred while updating user status" });
    }
}

//search single Customer Details
const searchCustomerById = async (req, res) => {
    const id = req.params['id'];
    let query = `select * from customer_details where customer_id=${id}`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ data: data.rows, totalUsers: data.rows.length, message: 'customer data fetched by ID.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getCustomerByEmailId = async (req, res) => {
    const { emailId } = req.body;
    const query = `select * from customer_details where primary_emailid='${emailId}'`;
    try {
        const response = await executeQuery(query, req.dbConnectionString);
        res.status(200).json({ data: response.rows });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

//search Customers by column
const searchCustomerLike = async (req, res) => {
    const { department, country } = req.body;
    let query = `select * from customer_details where "department" like N'%${department}%' and  "country" like N'%${country}%' `;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ data: data.rows, totalUsers: data.rows.length, message: 'customer data fetched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
};
//count status of customer by column
const countUserStatusSummary = async (dbConnectionString) => {
    const query = " SELECT isactive , COUNT(*) FROM  customer_details GROUP BY isactive ";
    const queryResponse = await executeQuery(query, dbConnectionString);
    const data = queryResponse?.rows?.reduce((acc, row) => {
        acc.total += Number(row.count);
        const status = row.isactive ? "active" : "inactive";
        acc[status] = Number(row.count);
        return acc;
    }, { total: 0 });
    return data;
}

const countUserStatus = async (req, res) => {
    try {
        const data = await countUserStatusSummary(req.dbConnectionString);
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const addCustomerIntoCRM = async (req, res) => {
    const customers = req.body;
    try {
        let result = {
            success: [],
            error: []
        }
        for (let i = 0; i < customers?.length; i++) {
            const { email, phoneNumber, firstName, lastName, id } = customers[i];
            const query = `INSERT INTO "customer_details" (
                    "firstname", "lastname", "title", "department", "company_name", 
                    "revenue", "phone_number", "mobile_number", "fax_number", "primary_emailid", "secondary_emailid", "website", "industry", "address_1",
                    "address_2", "pincode", "city", "country", "lead_owner_id", "lead_owner_first_name", "lead_owner_last_name", "lead_owner_email", 
                    "lead_owner_mobile", "lead_location", "lead_source", "deal_amount", "stage", "activity", "probability", "closing_date", "business_type",
                    "enable_whatsapp", "auth_user_id") 
                    VALUES ('${firstName}', '${lastName}', '', '', '', 
                    '', '', '${phoneNumber}', '', '${email}', '', '', '', '',
                    '', '', '', '', '', '', '', '',
                    '', '', '', '', '', '', '', '', '', false, '${id}')`;

            const data = await executeQuery(query, req.dbConnectionString);
            if (data && data.rowCount) {
                result.success.push(email);
            } else {
                result.error.push(email);
            }
        }
        res.status(OK).json(result);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || "Error while adding CRM contact." });
    }
}

const updateCustomerIntoCRM = async (req, res) => {
    const customers = req.body;
    try {
        let result = {
            success: [],
            error: []
        }
        for (let i = 0; i < customers?.length; i++) {
            const { phoneNumber, firstName, lastName, customerId, authUserId } = customers[i];
            const query = `UPDATE "customer_details" 
                            SET 
                            "firstname" = '${firstName || ""}',
                            "lastname" = '${lastName || ""}',
                            "mobile_number" = '${phoneNumber || ""}',
                            "phone_number" = '${phoneNumber || ""}',
                            "auth_user_id" = '${authUserId || ""}'
                            WHERE customer_id = '${customerId || ""}'`;
            const data = await executeQuery(query, req.dbConnectionString);
            if (data && data.rowCount) {
                result.success.push(authUserId);
            } else {
                result.error.push(authUserId);
            }
        }
        res.status(OK).json(result);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || "Error while adding CRM contact." });
    }
}

const addQuotationReq = async (req, res) => {
    const { origin, shared_with, destination, tariff_20, tariff_40, tariff_40hc, commodity, weight, cargo_ready_date, store_date, hazardous, status, loadType, packageDetails, totalVolume, totalWeight } = req.body;
    const authUserId = req.user.id;
    const weightToInsert = loadType === 'LCL' ? totalWeight : weight;
    const sharedWithAuthUserIds = shared_with?.map(u => u.authUserId);
    try {
        const query1 = `SELECT * FROM "customer_details" WHERE auth_user_id='${authUserId}'`;
        const customerQueryResponse = await executeQuery(query1, req.dbConnectionString);
        if (customerQueryResponse && customerQueryResponse.rowCount) {
            const customer = customerQueryResponse.rows[0];
            const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            const query2 = `INSERT INTO "quotation_requests"
                (customer_id, origin,shared_with, destination,
                     tariff_20, tariff_40, tariff_40hc,
                      commodity, weight, cargo_ready_date, store_date,
                       hazardous, status,
                        created_on, created_by, updated_on, updated_by, volume, "loadType", "packageDetails")
                VALUES ('${customer.customer_id}', '${origin}','${sharedWithAuthUserIds}', '${destination}', '${tariff_20}'
            , '${tariff_40}', '${tariff_40hc}', '${commodity}', '${weightToInsert || 0}', '${cargo_ready_date}', '${store_date}', '${hazardous}'
            , '${status}', '${currentDateTimestamp}', '${customer.customer_id}', '${currentDateTimestamp}', '${customer.customer_id}', '${totalVolume}', '${loadType || "FCL"}', '${JSON.stringify(packageDetails)}')
             RETURNING id`;
            const response = await executeQuery(query2, req.dbConnectionString);
            if (response?.rows?.length > 0) {
                res.status(OK).send({ message: 'Quotation requested successfully' });
                const result = req.body;
                const customerName = `${customer.firstname} ${customer.lastname}`;
                const mailAdminBodyHTML = requestedQuote(result, customerName);
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
                for (const user of shared_with) {
                    await sendMail(
                        [user.email],
                        "Kuulie | Request Quotes",
                        mailAdminBodyHTML,
                        "",
                        attachments
                    );
                }
                return res.status(OK).send({});
            } else {
                console.log(response);
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while submitting quotation request." });
            }
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while getting customer details." });
        }
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const sendQuotationNotificationToUser = async (
    req,
    quotationRequestId,
    customer, user,
    type, message, details,
) => {
    if (!user?.auth_user_id) return;
    const authUserIds = [user?.auth_user_id];
    const userDetailsByAdminPortal = await axios.get(`${process.env.AUTH_API_URL}/api/users/by-userids/from-client-portal`,
        { headers: { Authorization: req.headers.authorization, userids: authUserIds } });
    const userAuthData = userDetailsByAdminPortal?.data?.length > 0 ? userDetailsByAdminPortal.data[0] : {};
    await addNotificationAndEmit(
        req.io,
        req.dbConnectionString,
        customer?.customer_id,
        customer?.auth_user_id,
        type,
        user?.auth_user_id,
        message,
        details);
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
    const emailId = userAuthData.email;
    // const quotationLink = `${process.env.CUSTOMER_PORTAL_URL}/quotations/details/${quotationRequestId}`;
    const receiverName = `${user.first_name} ${user.last_name}`;
    const mailBodyHTML = getQuotationTemplate(null, receiverName, message, details);
    await sendMail(emailId, `Kuulie | ${type}`, mailBodyHTML, '', attachments);
}

const updateQuotationReq = async (req, res) => {
    const { id, status } = req.params;
    const authUserId = req.user.id;
    console.log(authUserId)
    try {
        const getQuotationRequestQuery = `SELECT * FROM "quotation_requests" WHERE id = '${id}'`;
        const quotationRequestQueryResponse = await executeQuery(getQuotationRequestQuery, req.dbConnectionString);
        const quotationRequest = quotationRequestQueryResponse?.rows?.length > 0 ? quotationRequestQueryResponse?.rows[0] : null;

        if (!quotationRequest) {
            res.status(400).json({ message: "Invalid quotation request id" });
        }

        const getCustomerByAuthUserId = `select * from "customer_details" WHERE "auth_user_id" = '${authUserId}'`;
        const customerQueryResponse = await executeQuery(getCustomerByAuthUserId, req.dbConnectionString);
        const customer = customerQueryResponse?.rows?.length > 0 ? customerQueryResponse?.rows[0] : null;

        const getUserByIdQuery = `select * from "user_details" WHERE "auth_user_id"
         = '${quotationRequest.type === 'FLASH_RATE' ? authUserId : authUserId}'`;

        const userQueryResponse = await executeQuery(getUserByIdQuery, req.dbConnectionString);
        const user = userQueryResponse?.rows?.length > 0 ? userQueryResponse?.rows[0] : null;

        let type = '', message = '', details = '';
        const customerName = `${customer?.firstname} ${customer?.lastname}`;
        const quotationRequestCreatedDate = moment(quotationRequest.created_on).format(
            "DD-MM-YYYY"
        );
        switch (quotationRequest.type) {
            case 'FLASH_RATE':
                type = 'Flash Rate';
                message = `You have received a new flash rate ${status === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}`;
                details = `Customer ${customerName} has ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} the flash rate #${id} shared to them on ${quotationRequestCreatedDate}`;
                break;
            case 'CUSTOMER_REQUEST':
                type = 'Quotation Request';
                message = `You have received a Quotation ${status === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}`;
                details = `Customer ${customerName} has ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} the quotation #${id} shared to them on ${quotationRequestCreatedDate}`;
                break;
        }
        const customer_id = customer?.customer_id ? customer?.customer_id : quotationRequest.customer_id

        const updateQuotationRequestQuery = `UPDATE "quotation_requests" 
        SET status ='${status}', updated_on='${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}',
        updated_by='${customer_id}' WHERE id = '${id}'`;

        const data = await executeQuery(updateQuotationRequestQuery, req.dbConnectionString);
        if (data && data.rowCount > 0) {
            await sendQuotationNotificationToUser(req, id, customer, user, type, message, details);
            res.status(OK).send({ message: "Quotation request updated successfully" });
            const result = req.body;
            const clientId = req?.user?.client?.id

            const userAdminData = await axios.get(`${process.env.AUTH_API_URL}/api/users/admins/${clientId}`,
                { headers: { Authorization: req.headers.authorization } });

            const data = userAdminData?.data?.data;
            const mailAdminBodyHTML = acceptQuotation(result, customerName);
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
                    "Kuulie | Accept Quote",
                    mailAdminBodyHTML,
                    "",
                    attachments
                );
            }
            return res.status(OK).send({});
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error occurred while updating quotation request status." });
        }
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error occurred while updating quotation request status." })
    }
}

const getQuotationReqListByStatus = async (req, res) => {
    const status = req.params.status;
    const type = `'${req.params.type?.split(",").join("','")}'`;

    try {
        let query;
        if (req?.user?.role === "CUSTOMER") {
            /*
            query = `
            SELECT * FROM
            (
                SELECT * FROM
                "quotation_requests" q
                    INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id AND cd.auth_user_id = '${req.user.id}' AND q.status ='${status}' AND q.type IN (${type})
            ) qr
            LEFT JOIN 
            (
               SELECT mq.id as mq_id, mq.quotation_rate_output_id,mq.total_amount,qro.validity_date_from,mq.charges,
               qro.validity_date_to, qro.carrier, qro."contractOwner", qro.* FROM "my_quotations" mq
                   INNER JOIN  (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier, contract_owner as "contractOwner", contract_number, route_code, vessel as vessel_name, voyage_number, contract_type, via FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier, 'Online' as "contractOwner", '' as contract_number, route_code, vessel_name, voyage as voyage_number, '' as contract_type, via_way_name as via FROM "online_rates"         
                   ) qro
               ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id
            ) mqro
            ON mqro.mq_id = qr.my_quotation_id
            ORDER BY qr.created_on DESC
        `;
        */
            query = `
        SELECT *
            FROM (
                SELECT *
                FROM "quotation_requests" q
                INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id
                WHERE 
                cd.auth_user_id = '${req.user.id}'
                AND q.status ='${status}'
                AND q.type IN (${type})
            ) qr
            INNER JOIN (
                SELECT
                    mq.id AS mq_id,
                    mq.quotation_rate_output_id,
                    mq.total_amount,
                    COALESCE(qro.validity_date_from, o_rate.etd) AS validity_date_from,
                    COALESCE(qro.validity_date_to, o_rate.etd) AS validity_date_to,
                    COALESCE(qro.carrier, o_rate.carrier_code) AS carrier,
                    COALESCE(qro.contract_owner, 'Online') AS "contractOwner",
                    COALESCE(qro.contract_number, '') AS contract_number,
                    COALESCE(qro.route_code, o_rate.route_code) AS route_code,
                    COALESCE(qro.vessel, o_rate.vessel_name) AS vessel_name,
                    COALESCE(qro.voyage_number, o_rate.voyage) AS voyage_number,
                    COALESCE(qro.contract_type, '') AS contract_type,
                    COALESCE(qro.via, o_rate.via_way_name) AS via
                FROM "my_quotations" mq
                LEFT JOIN (
                    SELECT
                        quotation_rate_output_id::varchar,
                        validity_date_from,
                        validity_date_to,
                        carrier,
                        contract_owner,
                        contract_number,
                        route_code,
                        vessel,
                        voyage_number,
                        contract_type,
                        via
                    FROM "quotation_rate_output"
                ) qro
                ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id
                LEFT JOIN "online_rates" o_rate
                ON o_rate.online_rate_id::varchar = mq.quotation_rate_output_id
            ) mqro
            ON mqro.mq_id = qr.my_quotation_id
            ORDER BY qr.created_on DESC;
            `;
        } else {
            const loggedInuserAuthUserId = req.user.id;

            /*
            query = `
            SELECT * FROM
            (
                SELECT * FROM
                "quotation_requests" q
                    INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id AND q.status ='${status}'
                    AND q.type IN (${type})
                    AND (shared_with ILIKE '%${loggedInuserAuthUserId}%')
            ) qr
            LEFT JOIN 
            (
               SELECT mq.id as mq_id, mq.quotation_rate_output_id,mq.total_amount,qro.validity_date_from,mq.charges,
               qro.validity_date_to, qro.carrier, qro."contractOwner", qro.* FROM "my_quotations" mq
                   INNER JOIN  (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier, contract_owner as "contractOwner", contract_number, route_code, vessel as vessel_name, voyage_number, contract_type, via FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier, 'Online' as "contractOwner", '' as contract_number, route_code, vessel_name, voyage as voyage_number, '' as contract_type, via_way_name as via FROM "online_rates"         
                   ) qro
               ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id
            ) mqro
            ON mqro.mq_id = qr.my_quotation_id
            ORDER BY qr.created_on DESC
        `;
        */
            query = `
            SELECT *
                FROM (
                    SELECT *
                    FROM "quotation_requests" q
                    INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id
                    WHERE q.status ='${status}'
                    AND q.type IN (${type})
                    AND shared_with ILIKE '%${loggedInuserAuthUserId}%'
                ) qr
                INNER JOIN (
                    SELECT
                        mq.id AS mq_id,
                        mq.quotation_rate_output_id,
                        mq.total_amount,
                        COALESCE(qro.validity_date_from, o_rate.etd) AS validity_date_from,
                        COALESCE(qro.validity_date_to, o_rate.etd) AS validity_date_to,
                        COALESCE(qro.carrier, o_rate.carrier_code) AS carrier,
                        COALESCE(qro.contract_owner, 'Online') AS "contractOwner",
                        COALESCE(qro.contract_number, '') AS contract_number,
                        COALESCE(qro.route_code, o_rate.route_code) AS route_code,
                        COALESCE(qro.vessel, o_rate.vessel_name) AS vessel_name,
                        COALESCE(qro.voyage_number, o_rate.voyage) AS voyage_number,
                        COALESCE(qro.contract_type, '') AS contract_type,
                        COALESCE(qro.via, o_rate.via_way_name) AS via
                    FROM "my_quotations" mq
                    LEFT JOIN (
                        SELECT
                            quotation_rate_output_id::varchar,
                            validity_date_from,
                            validity_date_to,
                            carrier,
                            contract_owner,
                            contract_number,
                            route_code,
                            vessel,
                            voyage_number,
                            contract_type,
                            via
                        FROM "quotation_rate_output"
                    ) qro
                    ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id
                    LEFT JOIN "online_rates" o_rate
                    ON o_rate.online_rate_id::varchar = mq.quotation_rate_output_id
                ) mqro
                ON mqro.mq_id = qr.my_quotation_id
                ORDER BY qr.created_on DESC;
        `;
        }
        console.log(query)
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send(queryResponse?.rows || []);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getAllQuotationRequestsByStatus = async (req, res) => {
    const status = req.params.status;
    try {
        let query;
        if (req?.user?.role === "CUSTOMER") {
            query = `
            SELECT * FROM
            (
                SELECT * FROM
                "quotation_requests" q
                    INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id AND cd.auth_user_id = '${req.user.id}' AND q.status ='${status}'
            ) qr
            LEFT JOIN 
            (
               SELECT mq.id as mq_id, mq.my_quotation_id as quotation_uid, mq.quotation_rate_output_id,mq.total_amount,qro.validity_date_from,
               qro.validity_date_to, qro.carrier FROM "my_quotations" mq
                   INNER JOIN  (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier FROM "online_rates"         
                   ) qro
               ON qro.quotation_rate_output_id = mq.quotation_rate_output_id
            ) mqro
            ON mqro.mq_id = qr.my_quotation_id
            ORDER BY qr.created_on DESC
        `;
        } else {
            query = `
            SELECT * FROM
            (
                SELECT * FROM
                "quotation_requests" q
                    INNER JOIN "customer_details" cd ON cd.customer_id = q.customer_id AND q.status ='${status}'
            ) qr
            LEFT JOIN 
            (
               SELECT mq.id as mq_id, mq.my_quotation_id as quotation_uid, mq.quotation_rate_output_id,mq.total_amount,qro.validity_date_from,
               qro.validity_date_to, qro.carrier FROM "my_quotations" mq
                   INNER JOIN  (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier FROM "online_rates"         
                   ) qro
               ON qro.quotation_rate_output_id = mq.quotation_rate_output_id
            ) mqro
            ON mqro.mq_id = qr.my_quotation_id
            ORDER BY qr.created_on DESC
        `;
        }
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send({ data: queryResponse?.rows || [] });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getQuotationRequestCount = async (req, res) => {
    const authUserId = req.user.id;
    try {
        const query = `
            SELECT status, COUNT(*) FROM quotation_requests WHERE customer_id IN
            (SELECT customer_id FROM customer_details WHERE auth_user_id = '${authUserId}') 
            GROUP BY status
            `;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const countArray = queryResponse?.rows || [];
        const data = countArray.reduce((acc, item) => {
            acc[item.status] = Number(item.count);
            acc.TOTAL += Number(item.count);
            return acc;
        }, { TOTAL: 0, ACCEPTED: 0, SENT: 0, RECEIVED: 0, REJECTED: 0 });
        res.status(OK).send(data);
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getQuotationReqestCountByMonth = async (req, res) => {
    const authUserId = req.user.id;
    try {
        const formattedStartDate = moment().startOf('month').format('YYYY-MM-DD hh:mm');
        const formattedEndDate = moment().endOf('month').format('YYYY-MM-DD hh:mm');
        const query = `
        SELECT COUNT (*) FROM quotation_requests
	    WHERE customer_id IN(SELECT customer_id FROM customer_details WHERE auth_user_id = '${authUserId}')  
	    AND (cargo_ready_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}')
	  `;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const countArray = queryResponse?.rows || [];
        res.status(OK).send(countArray);

    }
    catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getQuotationRequestById = async (req, res) => {
    const id = req.params.id;
    const onlyRequestData = req.query['only-request-data'];
    try {
        let query = '';
        if (onlyRequestData) {
            query = `SELECT * FROM
            "quotation_requests" qr
                INNER JOIN "customer_details" cd ON cd.customer_id = qr.customer_id AND qr.id =${id}
            `;
        } else {
            /*
            query = `SELECT * FROM
            "quotation_requests" qr
                INNER JOIN "customer_details" cd ON cd.customer_id = qr.customer_id AND qr.id =${id}
                LEFT JOIN "my_quotations" mq ON mq.id = qr.my_quotation_id
                INNER JOIN (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier, contract_owner as "contractOwner", contract_number, route_code, vessel as vessel_name, voyage_number, contract_type, via FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier, 'Online' as "contractOwner", '' as contract_number, route_code, vessel_name, voyage as voyage_number, '' as contract_type, via_way_name as via FROM "online_rates"
                ) qro ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id::varchar
            `;
            */
            query = `
           SELECT qr.*, cd.*, mq.total_amount,
                COALESCE(qro.validity_date_from, o_rate.etd) AS validity_date_from,
                COALESCE(qro.validity_date_to, o_rate.etd) AS validity_date_to,
                COALESCE(qro.carrier, o_rate.carrier_code) AS carrier,
                COALESCE(qro.contract_owner, 'Online') AS "contractOwner",
                COALESCE(qro.contract_number, '') AS contract_number,
                COALESCE(qro.route_code, o_rate.route_code) AS route_code,
                COALESCE(qro.vessel, o_rate.vessel_name) AS vessel_name,
                COALESCE(qro.voyage_number, o_rate.voyage) AS voyage_number,
                COALESCE(qro.contract_type, '') AS contract_type,
                COALESCE(qro.via, o_rate.via_way_name) AS via
            FROM "quotation_requests" qr
            INNER JOIN "customer_details" cd ON cd.customer_id = qr.customer_id AND qr.id = ${id}
            LEFT JOIN "my_quotations" mq ON mq.id = qr.my_quotation_id
            LEFT JOIN (
                SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier, contract_owner, contract_number, route_code, vessel, voyage_number, contract_type, via FROM "quotation_rate_output"
            ) qro ON qro.quotation_rate_output_id::varchar = mq.quotation_rate_output_id::varchar
            LEFT JOIN "online_rates" o_rate ON o_rate.online_rate_id::varchar = mq.quotation_rate_output_id::varchar
            ORDER BY qr.created_on DESC;
           `;
        }
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse?.rows?.length > 0) {
            res.status(OK).send(queryResponse?.rows[0]);
        } else {
            console.log("Error - ", queryResponse, query);
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while fetching quote data" });
        }
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getFilteredQuotationRequests = async (req, res) => {
    const { quotationRequestId, origin, destination, cargoReadyDate } = req.body;
    let queryFilter;
    if (quotationRequestId) {
        queryFilter = `qr.id =${quotationRequestId}`;
    } else {
        queryFilter = `qr.origin ILIKE '${origin}' AND qr.destination ILIKE '${destination}' AND qr.cargo_ready_date = '${moment(cargoReadyDate).format('YYYY-MM-DD HH:mm:ss')}'`;
    }
    try {
        const query = `SELECT *, qr.id as "quotationRequestId" FROM
            "quotation_requests" qr
                INNER JOIN "customer_details" cd ON cd.customer_id = qr.customer_id AND ${queryFilter} 
                LEFT JOIN "my_quotations" mq ON mq.id = qr.my_quotation_id
                INNER JOIN (
                    SELECT quotation_rate_output_id::varchar, validity_date_from, validity_date_to, carrier FROM "quotation_rate_output"
                    UNION
                    SELECT online_rate_id::varchar as quotation_rate_output_id, etd as validity_date_from, eta as validity_date_to, carrier_code as carrier FROM "online_rates"         
                ) qro ON qro.quotation_rate_output_id = mq.quotation_rate_output_id
            `;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send({ data: queryResponse?.rows });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getProfileDetails = async (req, res) => {
    const authUserId = req.user.id;
    const query = `SELECT *, c.name as company_name
        FROM customer_details cd
            INNER JOIN companies c
            ON cd.company = c.id AND cd.isdelete != true AND cd.auth_user_id = '${authUserId}'
            ORDER BY cd.customer_id DESC;`;
    try {
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        let data = {};
        if (queryResponse?.rows?.length > 0) {
            data = queryResponse.rows[0];
        } else {
            console.log("Error - ", queryResponse, query);
        }
        res.status(OK).send({ data });
    } catch (err) {
        console.log("Error - ", err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateProfileDetails = async (req, res) => {
    const {
        firstname,
        lastname,
        mobile_number
    } = req.body;
    const authUserId = req.user.id;
    const query = `UPDATE "customer_details" 
                SET 
                "firstname" = '${firstname || ""}',
                "lastname" = '${lastname || ""}',
                "mobile_number" = '${mobile_number || ""}'
                 WHERE auth_user_id = '${authUserId || ""}'`;
    try {

        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.length === 1 ? queryResponse.rows[0] : {};
        res.status(OK).send({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateCompanyDetails = async (req, res) => {
    const {
        company_name,
        website,
        business_type
    } = req.body;
    const authUserId = req.user.id;
    const query = `UPDATE "customer_details" 
                SET 
                "company_name" = '${company_name || ""}',
                "website" = '${website || ""}',
                "business_type" = '${business_type || ""}'
                 WHERE auth_user_id = '${authUserId || ""}'`;
    try {

        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows?.length === 1 ? queryResponse.rows[0] : {};
        res.status(OK).send({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getQuotationByCustomerId = async (req, res) => {
    const customerId = req.params.id;
    try {
        const query = `select * from quotation_requests where customer_id = ${customerId};`
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send(queryResponse);
    }
    catch (error) { }
}

const getTotalTransactionForOrdersByCustomerId = async (req, res) => {
    const customerId = req.params.id;
    try {
        const query = `select COUNT(*) from quotation_requests where customer_id=${customerId};`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send(queryResponse?.rows || []);
    }
    catch (error) { }
}

const getTotalTEUForOrdersByCustomerId = async (req, res) => {
    const customerId = req.params.id;
    try {
        const query = `select SUM(COALESCE(tariff_20,0)+ COALESCE(tariff_40,0) + COALESCE(tariff_40hc,0)) from quotation_requests where customer_id = ${customerId};`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send(queryResponse?.rows || []);
    }
    catch (error) { }
}

const getTotalVolumeAmountForOrdersByCustomerId = async (req, res) => {
    const customerId = req.params.id;
    try {
        const query = `
        select SUM(total_amount) from my_quotations mq inner join quotation_requests qr on qr.my_quotation_id =  mq.id 
        where qr.customer_id = ${customerId} and qr.status = 'ACCEPTED';`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send(queryResponse?.rows || []);
    }
    catch (error) {

    }
}

const getAllCompanies = async (req, res) => {
    const query = "SELECT * FROM companies ORDER BY created_on DESC;";
    try {
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse.rows || [];
        res.status(OK).send({ data });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
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

const sendCustomerRequestNotificationToAdmin = async (authUserId, req, requestFormValue) => {
    const getCustomerByAuthUserId = `select * from "customer_details" WHERE "auth_user_id" = '${authUserId}'`;
    const customerQueryResponse = await executeQuery(getCustomerByAuthUserId, req.dbConnectionString);
    const customer = customerQueryResponse?.rows?.length > 0 ? customerQueryResponse?.rows[0] : null;
    const customerName = `${customer?.firstname} ${customer?.lastname}`;
    const request_id = requestFormValue[0].request_id
    const link = `${process.env.CLIENT_PORTAL_URL}/request-form-details/view/${request_id}`;
    const mailSubject = `Kuulie - ${requestFormValue[0].requestFor}, ${requestFormValue[0].tradeLane} from ${customerName}`;

    const welcomeGreeting = 'Hi';
    const customerRequestFormHTML = getCustomerRequestFormSubmissionHTML(welcomeGreeting, customerName, link);
    const RequestFormRecipientEmailId = process.env.LUINA_ENQUIRY_MAIL
    await sendMail(
        [RequestFormRecipientEmailId],
        mailSubject,
        customerRequestFormHTML,
        "",
    );
}

const createCustomerRequest = async (req, res) => {
    const { requestFor,
        cargoReadyDate,
        tradeLane,
        office,
        phoneNumber,
        email,
        accountStatus,
        commodity,
        hsCode,
        equipmentType,
        cargoWeight,
        customerBackground,
        targetedVolume,
        requestedValidity,
        presentForwarder,
        existingRateBenchmark,
        reasonForUsage,
        termOfDelivery,
        specialRequirements,
        portDetails,
        polDetails,
        haulageMode,
        remark,
        document_name
    } = req.body;
    const uploadedFile = req.file;
    const fileName = req.file?.originalname;
    const filePath = req.file?.location;
    const contentType = req.file?.contentType;
    const fileKey = req.file?.key;
    try {
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const authUserId = req.user.id;
        const validityDate = moment(new Date()).add(180, 'days').format('YYYY-MM-DD HH:mm:ss');
        const query = `  
        INSERT INTO "customer_request" 
        (
            "requestFor",
            "cargoReadyDate",
            "tradeLane",
            "office",
            "phoneNumber",
            "email",
            "accountStatus",
            "commodity",
            "hsCode",
            "equipmentType",
            "cargo_weight",
            "customerBackground",
            "targetedVolume",
            "requestedValidity",
            "presentForwarder",
            "existingRateBenchmark",
            "reasonForUsage",
            "termOfDelivery",
            "specialRequirements",
            "portDetails",
            "pol_details",
            "haulageMode",
            "remark",
            "document_name",
            "file_name", 
            "file_path",
            "content_type",
            "file_key",
            "status",
            "validity_date",
            "auth_user_id",
            "created_on",
            "created_by"
        )
        VALUES (
            '${requestFor || ''}',
            ${cargoReadyDate ? `'${getPgSQLFormattedDateTime(cargoReadyDate)}'` : 'null'},
            '${tradeLane || ''}',
            '${office || ''}',
            '${phoneNumber || ''}',
            '${email || ''}',
            '${accountStatus || ''}',
            '${commodity || ''}',
            '${hsCode || ''}',
            '${equipmentType || ''}',
            '${cargoWeight || ''}',
            '${customerBackground || ''}',
            '${targetedVolume || ''}',
            '${requestedValidity || ''}',
            '${presentForwarder || ''}',
            '${existingRateBenchmark || ''}',
            '${reasonForUsage || ''}',
            '${termOfDelivery || ''}',
            '${specialRequirements || ''}',
            '${portDetails || ''}',
            '${polDetails || ''}',
            '${haulageMode || ''}',
            '${remark || ''}',
            '${document_name || ''}',
            '${fileName || ''}',
            '${filePath || ''}',
            '${contentType || ''}',
            '${fileKey || ''}',
            'SENT',
            '${validityDate || ''}',
            '${authUserId || ''}',
            '${currentDateTimestamp}',
            '${authUserId}'
        )  RETURNING request_id,"requestFor","tradeLane"`;
        const customerRequestQuery = await executeQuery(query, req.dbConnectionString);
        const requestFormValue = customerRequestQuery.rows
        if (customerRequestQuery) {
            await sendCustomerRequestNotificationToAdmin(authUserId, req, requestFormValue,);
            res.status(OK).json({ message: "Customer request form submitted successfully" });
        } else {
            res.status(500).json({ message: "Error while submitting customer request form" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Error while submitting customer request form" });
    }
};

const getCustomerRequest = async (req, res) => {
    const pageSize = req.query.pageSize || 10;
    const pageNumber = req.query.pageNumber || 1;
    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;
    try {
        let query;
        const userId = req.user.id;
        const status = req.params.status;
        if (req?.user?.role === 'CUSTOMER') {
            query = `
                    SELECT *, cr.auth_user_id
                    FROM "customer_request" cr
                    INNER JOIN "customer_details" cd ON cd.auth_user_id = cr.auth_user_id AND cr.status = '${status}'
                    WHERE cr.auth_user_id = '${userId}'
                `;
        } else {
            query = `SELECT *,cr.auth_user_id  FROM
        "customer_request" cr
            INNER JOIN "customer_details" cd ON cd.auth_user_id = cr.auth_user_id AND
         cr.status = '${status}' LIMIT ${limit} OFFSET ${offset}`;
        }
        const countQuery = `SELECT COUNT(*) FROM "customer_request"`;
        const totalCount = await executeQuery(countQuery, req.dbConnectionString);
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const totalRecords = parseInt(totalCount.rows[0].count);
        res.status(OK).send
            ({
                data: queryResponse?.rows,
                currentPage: pageNumber,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize),
                totalRecords: totalRecords,
            });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

const getCustomerRequestById = async (req, res) => {
    const id = req.params.id;
    try {
        const query = `SELECT * FROM "customer_request" WHERE "request_id" = '${id}'`
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        res.status(OK).send({ data: queryResponse?.rows });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getStringValue = value => value ? `'${value}'` : "''";
const getDateValue = value => value ? `'${value}'` : "NULL";

const createCompany = async (req, res) => {
    const {
        name, business_type, website, contact_number, country, city, address, tier, trade_lane, commence_date, expiry_date, lead_first_name, lead_last_name, office_phone, title, department, probability, deal_size, stage, closing_date
    } = req.body;
    try {
        const authUserId = req.user.id;
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const deleted = false
            , active = true,
            created_on = currentDateTimestamp,
            created_by = authUserId;
        const query = `INSERT INTO companies(
            name, business_type,
            website, contact_number,
            country, city,
            address, tier,
            trade_lane, commence_date,
            expiry_date, lead_first_name,
            lead_last_name, office_phone,
            title, department,
            probability, deal_size,
            stage, closing_date,
            deleted, active, created_on, created_by)
            VALUES (
            ${getStringValue(name)}, ${getStringValue(business_type)},
            ${getStringValue(website)}, ${getStringValue(contact_number)},
            ${getStringValue(country)}, ${getStringValue(city)},
            ${getStringValue(address)}, ${getStringValue(tier)},
            ${getStringValue(trade_lane)}, ${getDateValue(commence_date)},
            ${getDateValue(expiry_date)}, ${getStringValue(lead_first_name)},
            ${getStringValue(lead_last_name)}, ${getStringValue(office_phone)},
            ${getStringValue(title)}, ${getStringValue(department)},
            ${getStringValue(probability)}, ${getStringValue(deal_size)},
            ${getStringValue(stage)}, ${getDateValue(closing_date)},
            ${deleted}, ${active},
            '${created_on}', '${created_by}');`;
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        if (queryResponse && queryResponse.rowCount) {
            res.status(OK).send({ message: "New company added successfully." });
        } else {
            console.log("ERROR - ", query, queryResponse)
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding new company." });
        }
    } catch (err) {
        console.log("ERROR - ", err)
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while adding new company." });
    }
}

const updateCompany = async (req, res) => {
    const {
        name, business_type, website, contact_number, country, city, address,
        tier, trade_lane, commence_date, expiry_date, lead_first_name, lead_last_name,
        office_phone, title, department, probability, deal_size, stage, closing_date
    } = req.body;
    try {
        const authUserId = req.user.id;
        const companyId = req.params.id;
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const updated_on = currentDateTimestamp, updated_by = authUserId;

        const query = `
                UPDATE companies
                SET name=${getStringValue(name)}, business_type=${getStringValue(business_type)}, 
                website=${getStringValue(website)}, contact_number=${getStringValue(contact_number)},
                country=${getStringValue(country)}, city=${getStringValue(city)},
                address=${getStringValue(address)}, tier=${getStringValue(tier)},
                trade_lane=${(trade_lane)}, commence_date=${getDateValue(commence_date)},
                expiry_date=${getDateValue(expiry_date)}, lead_first_name=${getStringValue(lead_first_name)},
                lead_last_name=${getStringValue(lead_last_name)}, office_phone=${getStringValue(office_phone)},
                title=${getStringValue(title)}, department=${getStringValue(department)},
                probability=${getStringValue(probability)}, deal_size=${getStringValue(deal_size)},
                stage=${getStringValue(stage)}, closing_date=${getDateValue(closing_date)},
                updated_on='${updated_on}', updated_by='${updated_by}'
                WHERE id = ${getStringValue(companyId)};
        `;

        const data = await executeQuery(query, req.dbConnectionString);
        if (data && data.rowCount > 0) {
            res.status(OK).send({ message: "Company updated successfully" });
        } else {
            console.log("ERROR - ", data, query)
            res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while updating company." });
        }
    } catch (err) {
        console.log("ERROR - ", err)
        res.status(INTERNAL_SERVER_ERROR).send({ message: err?.message || "Error while updating company." });
    }
}

module.exports = {
    fetchCustomerDetails,
    updateCustomerDetails,
    deleteCustomerDetails,
    createCustomerDetails,
    searchCustomerById,
    getCustomerByEmailId,
    searchCustomerLike,
    deleteCustomerDetailsBulk,
    updateUserStatus,
    countUserStatus,
    addCustomerIntoCRM,
    updateCustomerIntoCRM,
    addQuotationReq,
    updateQuotationReq,
    getQuotationReqListByStatus,
    getQuotationRequestCount,
    getQuotationReqestCountByMonth,
    getQuotationRequestById,
    getProfileDetails,
    updateProfileDetails,
    updateCompanyDetails,
    getQuotationByCustomerId,
    getTotalTransactionForOrdersByCustomerId,
    getTotalTEUForOrdersByCustomerId,
    getTotalVolumeAmountForOrdersByCustomerId,
    getAllQuotationRequestsByStatus,
    getFilteredQuotationRequests,
    getAllCompanies,
    createCustomerRequest,
    getCustomerRequest,
    getCustomerRequestById,
    createCompany,
    updateCompany
};
