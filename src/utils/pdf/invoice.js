const moment = require('moment');
const getFormattedDate = (date) => moment(date).format('DD/MM/YYYY');
const getInvoicePDFHTML = (invoiceDetails) => `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <title>Invoice</title>

    <style>
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            font-size: 0.8rem;
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #555;
        }

        .invoice-box table {
            width: 100%;
            line-height: inherit;
            text-align: left;
        }

        .invoice-box table td,
        .invoice-box table th {
            padding: 5px;
            vertical-align: top;
        }

        .invoice-box table tr.top table td.title {
            font-size: 2.5rem;
            line-height: 2.5rem;
            color: #333;
        }
        
        .invoice-box table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }

        .invoice-box table tr.item td,
        .invoice-box table tr.item th {
            border: 1px solid #EEEEEE;
        }

        .invoice-box table tr.item.last td {
            border-bottom: none;
        }

        .invoice-box table tr.total td:nth-child(2) {
            border-top: 2px solid #eee;
            font-weight: bold;
        }

        @media only screen and (max-width: 600px) {
            .invoice-box table tr.top table td {
                width: 100%;
                display: block;
                text-align: center;
            }

            .invoice-box table tr.information table td {
                width: 100%;
                display: block;
                text-align: center;
            }
        }

        /** RTL **/
        .invoice-box.rtl {
            direction: rtl;
            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
        }

        .invoice-box.rtl table {
            text-align: right;
        }

        .invoice-box.rtl table tr td:nth-child(2) {
            text-align: left;
        }

        .heading-table td {
            padding: 0 !important;
            text-align: left !important;
        }

        .message {
            padding-top: 15px !important;
            padding-bottom: 15px !important;
        }

        .note {
            padding-top: 15px !important;
            padding-bottom: 0 !important;
        }

        ol {
            margin: 0;
        }
    </style>
</head>

<body>
    <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
            <tr class="top">
                <td colspan="7">
                    <table>
                        <tr>
                            <td colspan="7" class="title">
                                Kuulie - Invoice
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr class="information">
                <td colspan="7">
                    <table>
                        <tr>
                            <td>
                                <table class="heading-table">
                                    <tr>
                                        <td>To</td>
                                        
                                    </tr>
                                    <tr>
                                        <td>${invoiceDetails.firstname} ${invoiceDetails.lastname}</td>
                                    </tr>
                                    <tr>
                                        <td>${invoiceDetails.bill_to_company_name}</td>
                                    </tr>
                                    <tr>
                                        <td>${invoiceDetails.bill_to_address}</td>
                                    </tr>
                                    <tr>
                                        <td>${invoiceDetails.bill_to_city}, ${invoiceDetails.bill_to_state}, ${invoiceDetails.bill_to_country}, ${invoiceDetails.bill_to_zipcode}</td>
                                    </tr>
                                </table>
                            </td>

                            <td>
                                <table class="heading-table" style="width: 260px;float: right;">
                                    <tr>
                                        <td style="width: 100px;">Invoice</td>
                                    </tr>
                                    <tr>
                                        <td style="width: 100px;">Invoice no ${invoiceDetails.alphanumeric_invoice_id}</td>
                                    </tr>
                                    <tr>
                                        <td style="width: 100px;">${getFormattedDate(invoiceDetails.created_on)}</td>
                                    </tr>
                                    <tr>
                                        <td style="width: 100px;">Due Date</td>
                                    </tr>
                                    <tr>
                                        <td style="width: 100px;">${getFormattedDate(invoiceDetails.due_date)}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>            
            <tr class="heading">
                <td colspan="7">Item Details</td>
            </tr>
            <tr class="item">
                <th style="width: 40mm;">Item No</th>
                <th style="width: 15mm;">Description</th>
                <th style="width: 20mm;">Unt</th>
                <th style="width: 25mm;">Rate</th>
                <th style="width: 25mm;">Amount</th>
            </tr>
            ${invoiceDetails?.itemList?.map((item, index) =>`
            <tr class="item">
                <td>${index+1}</td>
                <td>${item.description}</td>
                <td>${item.number_of_units}</td>
                <td>${item.rate}</td>
                <td>${item.number_of_units * item.rate}</td>
            </tr>
            `).join("")}
            <tr class="item">
                <td colspan="4" style="text-align:right">Sub Total</td>
                <td>${invoiceDetails?.amount}</td>
            </tr>
            <tr class="item">
                <td colspan="4" style="text-align:right">Tax in %</td>
                <td>${invoiceDetails?.tax}</td>
            </tr>
            <tr class="item">
                <td colspan="4" style="text-align:right">Grand Total</td>
                <td>${parseFloat(parseFloat(invoiceDetails?.amount) + parseFloat((invoiceDetails?.amount / 100)) * parseFloat(invoiceDetails?.tax))}</td>
            </tr>
            <tr>
                <td colspan="5" class="note">
                    <b>Bank Detail:</b>
                    <span>Account name,Account number,IFSC Code</span>
                </td>
            </tr>
            <tr>
                <td colspan="5" class="note">
                    <b>Customer Rate:</b>
                    <span>STARK Industries is a company based out of RD59,pay de la Lorie France.</span>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;

module.exports = getInvoicePDFHTML;