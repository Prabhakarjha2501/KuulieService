require('dotenv').config();
const moment = require('moment')
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const logger = require('../../logger/logger');

module.exports.uploadDocument = async (req, res) => {
    const authUserId = req.user.id;
    const {
        documentType,
        documentName,
        linkToModuleName,
        moduleRecordId,
        sharedWithId,
        carriers,
        type
    } = req.body;

    try {
        const fileName = req.file.originalname;
        const filePath = req.file.location;
        const contentType = req.file.contentType;
        const fileKey = req.file.key;
        const getDateValue = value => value ? `'${value}'` : "null";
        const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        if (authUserId) {
            const query = `
                INSERT INTO document(
                "type", "name", "file_name", "file_path", "content_type", "file_key", "created_on", "created_by", "updated_on", "updated_by", "module_name", "record_id","shared_with","carrier_name","document_type")
            VALUES
                ('${documentType}','${documentName}', '${fileName}','${filePath}','${contentType}','${fileKey}','${currentDateTimestamp}', '${authUserId}', NULL, NULL, '${linkToModuleName}', '${moduleRecordId}','${sharedWithId}','${carriers}','${type}')
            RETURNING id
          `;
            const response = await executeQuery(query, req.dbConnectionString);

            if (response && response.rowCount > 0) {
                return res.status(OK).send(response.rows[0])
            }
        }
        return res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while uploading document." });
    } catch (error) {
        console.log("Upload document", error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error });
    }
}

module.exports.getDocumentList = async (req, res) => {
    const sharedWithMe = req.query.sharedWithMe === "true";
    const authUserId = req.user.id;
    const isCustomer = req.user?.role === "CUSTOMER";
    let customerCompanyFilter = "";
    let customerCompanyId = "";

    if (isCustomer) {
        const query1 = `select * from customer_details where auth_user_id = '${authUserId}'`;
        const customerQueryResponse = await executeQuery(query1, req.dbConnectionString);
        const customer = customerQueryResponse?.rows.length > 0 ? customerQueryResponse?.rows[0] : null;
        customerCompanyId = customer.company || '';
        customerCompanyFilter = `AND cmp.id = '${customerCompanyId}'`;
    }
    const document_type = req.query.type;
    try {
        let query;
        if (document_type === 'DOCUMENT') {
            if (isCustomer) {
                if (sharedWithMe) {
                    query = `
                SELECT 
                d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on, d.shared_with, ud.first_name,d.document_type,d.carrier_name , ud.last_name 
                FROM document d LEFT JOIN user_details ud ON d.created_by = ud.auth_user_id
                WHERE d.shared_with Like '%${customerCompanyId}%' ORDER BY 1 DESC;`;
                } else {
                    query = `                
                SELECT 
                d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on, d.shared_with,d.document_type,d.carrier_name , ud.first_name, ud.last_name 
                FROM document d LEFT JOIN user_details ud ON d.shared_with = ud.auth_user_id
                WHERE d.created_by='${authUserId}' AND document_type='${document_type}' ORDER BY created_on DESC;`;
                }
            } else {
                if (sharedWithMe) {
                    query = `
                SELECT 
                d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on, d.shared_with,d.carrier_name ,cd.firstname, cd.lastname 
                FROM document d LEFT JOIN customer_details cd ON d.created_by = cd.auth_user_id
                WHERE d.shared_with='${authUserId}' ORDER BY  1 DESC;`;
                } else {
                    //     query = `
                    // SELECT 
                    // d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on, d.shared_with,d.carrier_name , cd.firstname, cd.lastname, d.document_type
                    // FROM document d LEFT JOIN customer_details cd ON d.shared_with = cd.auth_user_id
                    // WHERE (d.created_by='${authUserId}' OR document_type != 'DOCUMENT') AND document_type='${document_type}' ORDER BY created_on DESC;`;

                    query = `SELECT
                d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on,
                d.shared_with,d.carrier_name, d.document_type
                FROM document d 
                WHERE d.shared_with LIKE '%${customerCompanyId}%' AND document_type = '${document_type}' ORDER BY created_on DESC;
            `
                }

            }
        } else {
            query = `
            SELECT d.id, d.type, d.name, d.file_name, d.file_path, d.content_type, d.file_key, d.created_on, d.shared_with,d.carrier_name , cd.first_name, cd.last_name, d.document_type
               FROM document d LEFT JOIN user_details cd ON d.created_by = cd.auth_user_id
               WHERE (d.created_by='${authUserId}' OR document_type != 'DOCUMENT') AND document_type='${document_type}' ORDER BY created_on DESC;`;
        }
        const queryResponse = await executeQuery(query, req.dbConnectionString);
        const data = queryResponse?.rows?.map(row => ({
            document_id: row.id,
            documentType: row.type,
            type: row.document_type,
            documentName: row.name,
            fileName: row.file_name,
            filePath: row.file_path,
            contentType: row.content_type,
            fileKey: row.file_key,
            createdOn: row.created_on,
            carriers: row.carrier_name,
            sharedWith: isCustomer ? (`${row.firstname || row.first_name} ${row.lastname || row.last_name}`) : row.shared_with,
            // sharedWith: row.shared_with,
            sharedBy: `${row.firstname || row.first_name} ${row.lastname || row.last_name}`
        }));
        return res.status(OK).send({ data });
    } catch (error) {
        console.log("Get document list", error);
        return res.status(INTERNAL_SERVER_ERROR).send({ message: error.message || error });
    }
}

module.exports.getModuleIds = async (req, res) => {
    try {
        const { linkToModuleName } = req.params;
        let crmQuery, quoteQuery, capacityQuery, bookingQuery, invoiceQuery, automationQuery;
        switch (linkToModuleName) {
            case "CRM":
                crmQuery = `select customer_id from customer_details`;
                return executeQuery(crmQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send(data?.rows?.map(row => row.customer_id));
                });
                break;

            case "Quotations":
                quoteQuery = `select my_quotation_id from my_quotations`;
                return executeQuery(quoteQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send(data?.rows?.map(row => row.my_quotation_id));
                });
                break;

            case "Capacity Planning":
                capacityQuery = `select allocation_id from allocation_planning`;
                return executeQuery(capacityQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send(data?.rows?.map(row => row.allocation_id));
                });
                break;

            case "Bookings":
                bookingQuery = `select * from customer_details `;
                return executeQuery(bookingQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send([]);
                });
                break;

            case "Invoices":
                invoiceQuery = `select * from customer_details`;
                return executeQuery(invoiceQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send([]);
                });
                break;

            case "Automation":
                automationQuery = `select e_id from automation_excel_to_json `;
                return executeQuery(automationQuery, req.dbConnectionString).then((data) => {
                    res.status(200).send(data?.rows?.map(row => row.e_id));
                });
                break;

            default:
                console.log("Entered in Default case");
                throw "error";
        }

    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: error });
    }
}

module.exports.deleteDocumentById = async (req, res) => {
    const document_id = req.params.id;
    logger.info(document_id + "-----");
    const query = `Delete From document where id ='${document_id}'`;
    console.log(query)
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(OK).send({ data: data?.row?.document_id, message: "Document deleted sucessfully" });
        });
    } catch {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }

}