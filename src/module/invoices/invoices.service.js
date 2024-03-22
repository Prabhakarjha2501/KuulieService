require('dotenv').config();
const moment = require('moment')
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const getInvoicePDFHTML = require('../../utils/pdf/invoice');
const pdf = require('html-pdf');

const createInvoice = async (req, res) => {
    const authUserId = req.user.id;
    const {
        sameAddress, billToCustomerId, billToCompanyName, billToAddress,
        billToCity, billToState, billToZipcode,
        billToCountry, shipToCustomerId, shipToCompanyName, shipToAddress,
        shipToCity, shipToState, shipToZipcode,
        shipToCountry, customerNote, invoiceDetail, tax, amount, dueDate, balance } = req.body;

    const status = "OPEN";

    const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    const dueDateExtended = moment(currentDateTimestamp).add(dueDate, 'days').format('YYYY-MM-DD HH:mm:ss');

    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;

    if (user && user.user_id) {
        const query = `INSERT INTO "invoices" ("same_address", "bill_to_customer_id", "bill_to_company_name", "bill_to_address",
        "bill_to_city", "bill_to_state", "bill_to_zipcode", "bill_to_country", "ship_to_customer_id", "ship_to_company_name", "ship_to_address",
        "ship_to_city", "ship_to_state", "ship_to_zipcode", "ship_to_country", "customer_note", "created_on", "created_by", "updated_on",
        "updated_by", "due_date", "status", "tax", "amount", "balance")
        VALUES ('${sameAddress}', '${billToCustomerId}','${billToCompanyName}', '${billToAddress}', '${billToCity}',
         '${billToState}', '${billToZipcode}', '${billToCountry}', '${shipToCustomerId}','${shipToCompanyName}', 
         '${shipToAddress}', '${shipToCity}', '${shipToState}', '${shipToZipcode}', '${shipToCountry}',
          '${customerNote}', '${currentDateTimestamp}', '${user.user_id}', NULL, NULL,'${dueDateExtended}',
          '${status}', '${tax}', '${amount}','${balance}') RETURNING invoice_id`;

        try {
            const data = await executeQuery(query, req.dbConnectionString);
            if (data?.rowCount > 0) {
                for (let i = 0; i < invoiceDetail.length; i++) {
                    const { rate, description, unit, amount } = invoiceDetail[i];
                    const invoiceId = data.rows[0].invoice_id;
                    const invoiceDetailsQuery = `INSERT INTO "invoice_details"("invoice_id","description", "number_of_units", "rate", "created_on", "created_by", "updated_on", "updated_by")
              VALUES(${invoiceId},'${description}', '${unit}',  '${rate}', '${currentDateTimestamp})', '${user.user_id}', NULL, NULL);`;
                    const invoiceDetailsQueryResponse = await executeQuery(invoiceDetailsQuery, req.dbConnectionString);
                }
                res.status(OK).send({ message: `Invoice Successfully added.` });
            }
            else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Error while adding invoice." });
            }
        }
        catch (err) {
            res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while adding invoice." });
        }
    }
}

const fetchInvoices = async (req, res) => {
    const authUserId = req.user.id;
    const getUserByAuthUserId = `select * from "user_details" WHERE "auth_user_id" = '${authUserId}'`;
    const userQueryResponse = await executeQuery(getUserByAuthUserId, req.dbConnectionString);
    const user = userQueryResponse?.rows.length > 0 ? userQueryResponse?.rows[0] : null;
    if (user && user.user_id) {
        const query = `select * from invoices where created_by = '${user.user_id}'`;
        try {
            return executeQuery(query, req.dbConnectionString).then(async (queryResponse) => {
                const data = await Promise.all(queryResponse.rows?.map(async (row) => {

                    const billCustomerId = row.bill_to_customer_id;
                    const shipCustomerId = row.ship_to_customer_id;
                    const invoiceId = row.invoice_id;

                    const billToCustomerQuery = `select firstname, lastname from customer_details where customer_id = ${billCustomerId} ;`;
                    const billToCustomerQueryResponse = await executeQuery(billToCustomerQuery, req.dbConnectionString);

                    const shipToCustomerQuery = `select firstname, lastname from customer_details where customer_id = ${shipCustomerId};`;
                    const shipToCustomerQueryResponse = await executeQuery(shipToCustomerQuery, req.dbConnectionString);

                    let billToCustomerSummery;
                    if (billToCustomerQueryResponse?.rows?.length > 0 && billToCustomerQueryResponse?.rows[0]) {
                        const billToCustomerNameRow = billToCustomerQueryResponse?.rows[0];
                        billToCustomerSummery = {
                            billCustomerId,
                            firstName: billToCustomerNameRow.firstname,
                            lastName: billToCustomerNameRow.lastname,
                        }
                    }
                    let shipToCustomerSummery;
                    if (shipToCustomerQueryResponse?.rows?.length > 0 && shipToCustomerQueryResponse?.rows[0]) {
                        const ShipToCustomerNameRow = billToCustomerQueryResponse?.rows[0];
                        shipToCustomerSummery = {
                            shipCustomerId,
                            firstName: ShipToCustomerNameRow.firstname,
                            lastName: ShipToCustomerNameRow.lastname,
                        }
                    }

                    return {
                        date: row.created_on,
                        invoiceNumber: row.alphanumeric_invoice_id,
                        dueDate: row.due_date,
                        status: row.status,
                        billToCustomerSummery,
                        shipToCustomerSummery,
                        amount: row.amount,
                        balance: row.balance,
                        tax: row.tax,
                        id: row.invoice_id
                    }
                }))
                res.status(OK).send({ data });
            })
        }
        catch (error) {
            res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while fetching invoice." });
        }
    }
}

const getInvoicesById = async (req, res) => {
    const { id } = req.params;
    const query = `select i.*, cd.firstname, cd.lastname from invoices i left join customer_details cd on i.bill_to_customer_id = cd.customer_id where i.invoice_id = '${id}'`;
    const invoiceDetailsQuery = `select * from invoice_details where invoice_id = '${id}';`;
    try {
        return executeQuery(query, req.dbConnectionString).then(async (queryResponse) => {
            if (queryResponse && queryResponse.rows) {
                let invoiceDetailsList = await executeQuery(invoiceDetailsQuery, req.dbConnectionString);
                if (invoiceDetailsList && invoiceDetailsList.rows) {
                    res.status(OK).send({ ...queryResponse.rows[0], itemList: invoiceDetailsList.rows });
                }
            }
        })
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}


const updateInvoceState = async (req, res) => {
    const { id, status } = req.params;
    const query = `Update "invoices" SET status='${status}' where invoice_id='${id}'`;
    try {
        return executeQuery(query, req.dbConnectionString).then(async (queryResponse) => {
            res.status(OK).send({ message: "Status changed successfully" });
        });
    }
    catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.message || err || "Error while updating invoice." });
    }
}

const createPDFAsync = (html, options) => new Promise(((resolve, reject) => {
    pdf.create(html, options).toBuffer((err, buffer) => {
        if (err !== null) {
            reject(err);
        }
        else {
            resolve(buffer);
        }
    });
}));

const successPdf = async (req, res, buffer) => {
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    return res.status(OK).send(buffer);
}

const getPdfInvoiceById = async (req, res) => {
    const { id } = req.params;
    const query = `select i.*, cd.firstname, cd.lastname from invoices i left join customer_details cd on i.bill_to_customer_id = cd.customer_id where i.invoice_id = '${id}'`;
    const invoiceDetailsQuery = `select * from invoice_details where invoice_id = '${id}';`;
    try {
        return executeQuery(query, req.dbConnectionString).then(async (queryResponse) => {
            if (queryResponse && queryResponse.rows) {
                let invoiceDetailsList = await executeQuery(invoiceDetailsQuery, req.dbConnectionString);
                if (invoiceDetailsList && invoiceDetailsList.rows) {
                    const buffer = await createPDFAsync(getInvoicePDFHTML({ ...queryResponse.rows[0], itemList: invoiceDetailsList.rows }), { format: 'a4' });
                    await successPdf(req, res, buffer);
                }
            }
        })
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err })
    }
}

module.exports = {
    createInvoice,
    fetchInvoices,
    getInvoicesById,
    updateInvoceState,
    getPdfInvoiceById
}