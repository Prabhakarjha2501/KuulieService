const moment = require('moment');
const { getCarrierLogo } = require('../image-utilities');
const { toRoundedFixed } = require('../services/shared.service');

const getFormattedDate = (date) => moment(date).format('DD/MM/YYYY')

const getCurrentDate = () => {
   return getFormattedDate(new Date());
}
const getAffterSevenDayDate = () => {
   return getFormattedDate(new Date().setDate(new Date().getDate() + 7));
}

const getCustomerAddress = (customer) => {
   return `
    ${customer.city}\n
    ${customer.country}
    `;
}

const originChargeTypes = ["export", "freight"];
const destinationChargeTypes = ["import", "b/l"];

const calcChargeWithCommission = (charge, commission) => {
   const updatedCharge = parseFloat(charge ? charge : 0);
   isPercentage = commission?.includes('%');
   const updatedCommission = parseFloat(isPercentage ? commission?.split('%')[0] : commission ? commission : 0);
   const sum = isPercentage ? (updatedCharge + (updatedCharge * (updatedCommission / 100))) : updatedCharge + updatedCommission;
   return sum;
}


const getMyQuotationPDFHTML = (customer, user, myQuotation, quotation, charges, client, originTotal,
   destinationTotal, origin,
   destination) => `
    <!DOCTYPE html>
    <html>
       <head>
          <meta charset="utf-8" />
          <title>Quotation</title>
          <style>
             html {
             zoom: 0.753
             }
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
             invoice-box table tr.top table td.logo{
             margin-left:250px
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
                            <td>
                               ${client?.logo ?
      `<img src="${client?.logo}" alt="Kuulie" height="70">`
      :
      'Kuulie'
   }
                            </td>
                            <td>
                               ${getCarrierLogo(quotation?.carrier || quotation?.carrier_code ) ?
      `<img src="${getCarrierLogo(quotation?.carrier ||  quotation?.carrier_code)}" style="float: right; margin-right: 60px" alt="carrier" height="60">`
      :
      quotation?.carrier || quotation?.carrier_code
   }
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
                                     <td>Customer Name</td>
                                     <td>${customer.firstname} ${customer.lastname}</td>
                                  </tr>
                                  <tr>
                                     <td>Address</td>
                                     <td>${getCustomerAddress(customer)}</td>
                                  </tr>
                                  <tr>
                                  <td></td>
                                  </tr>
                                  <tr>
                                    <td>Attention</td>
                                  </tr>
                               </table>
                            </td>
                            <td>
                               <table class="heading-table" style="
                                  width: 260px;
                                  float: right;
                                  ">
                                  <tr>
                                     <td style="width: 100px;">Quotation No.</td>
                                     <td style="width: 100px;">${myQuotation.id}</td>
                                  </tr>
                                  <tr>
                                     <td style="width: 100px;">Quotation Date</td>
                                     <td style="width: 100px;">${getCurrentDate()}</td>
                                  </tr>
                                  <tr>
                                     <td style="width: 100px;">Validity From</td>
                                     <td style="width: 100px;">${getFormattedDate(quotation.validity_date_from)}</td>
                                  </tr>
                                  <tr>
                                     <td style="width: 100px;">Validity Till</td>
                                     <td style="width: 100px;">${getFormattedDate(quotation.validity_date_to)}</td>
                                  </tr>
                               </table>
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
                                     <td>Port of Loading</td>
                                  </tr>
                                  <tr>
                                     <td style="font-size:17px ;font-weight:bold;">${origin}</td>
                                  </tr>
                               </table>
                            </td>
                            <td>
                               <table class="heading-table" style="
                                  width: 260px;
                                  float: right;
                                  ">
                                  <tr>
                                     <td style="width: 100px;">Port of Discharge</td>
                                  </tr>
                                  <tr>
                                     <td style="width: 100px; font-size:17px; font-weight:bold;">${destination}</td>
                                  </tr>
                               </table>
                            </td>
                         </tr>
                      </table>
                   </td>
                </tr>
                <tr>
                   <td  class="message">Dear  ${customer.firstname} ${customer.lastname}</td>
                </tr>
                <tr>
                   <td colspan="7" class="message">
                      Thank you for your recent enquiry. We are pleased to make you the following offer, for which please find our rates and further details below.
                   </td>
                </tr>
                <tr class="heading">
                   <td colspan="7">Freight Charges</td>
                </tr>
                <tr class="item">
                   <th style="width: 40mm;">Charge Name</th>
                   <th style="width: 15mm;">Currency</th>
                   <th style="width: 20mm;">20'STD</th>
                   <th style="width: 25mm;">40'STD</th>
                   <th style="width: 25mm;">40'HC</th>
                   <th>Note</th>
                </tr>
                <tr class="item">
                   <td>Basic Ocean Freight</td>
                   <td>USD</td>
                   <td>${myQuotation?.tariff20 > 0 ? calcChargeWithCommission(quotation.tariff_20, myQuotation.commission20ft) + myQuotation.additional_charges_20 : 'NA'}</td>
                   <td>${myQuotation?.tariff40 > 0 ? calcChargeWithCommission(quotation.tariff_40, myQuotation.commission40ft) + myQuotation.additional_charges_40 : 'NA'}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? calcChargeWithCommission(quotation.tariff_40hc, myQuotation.commission40hc) + myQuotation.additional_charges_40hc : 'NA'}</td>
                   <td></td>
                </tr>
                <tr class="heading">
                   <td style="width: 40mm;">Total </td>
                   <td>USD</td>
                   <td>${myQuotation?.tariff20 > 0 ? calcChargeWithCommission(quotation.tariff_20, myQuotation.commission20ft) + myQuotation.additional_charges_20 : 'NA'}</td>
                   <td>${myQuotation?.tariff40 > 0 ? calcChargeWithCommission(quotation.tariff_40, myQuotation.commission40ft) + myQuotation.additional_charges_40 : 'NA'}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? calcChargeWithCommission(quotation.tariff_40hc, myQuotation.commission40hc) + myQuotation.additional_charges_40hc : 'NA'}</td>
                   <td></td>
                </tr>
                <tr class="heading">
                   <td colspan="7">Origin Charges</td>
                </tr>
                <tr class="item">
                   <th style="width: 40mm;">Charge Name</th>
                   <th style="width: 15mm;">Currency</th>
                   <th style="width: 20mm;">20'STD</th>
                   <th style="width: 25mm;">40'STD</th>
                   <th style="width: 25mm;">40'HC</th>
                   <th>Note</th>
                </tr>
                ${charges
      .filter(charge => originChargeTypes.includes(charge.charge_type?.toLowerCase()))
      .map((charge) => `
                <tr class="item">
                   <td>${charge.charge_name}</td>
                   <td>${charge.currency}</td>
                   <td>${myQuotation?.tariff20 > 0 ? charge.tariff_20 : "NA"}</td>
                   <td>${myQuotation?.tariff40 > 0 ? charge.tariff_40 : "NA"}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? charge.tariff_40hc : "NA"}</td>
                   <td></td>
                </tr>
                `).join("")}
                <tr class="heading">
                   <td style="width: 40mm;">Total </td>
                   <td>USD</td>
                   <td>${myQuotation?.tariff20 > 0 ? originTotal.tariff20 : "NA"}</td>
                   <td>${myQuotation?.tariff40 > 0 ? originTotal.tariff40 : "NA"}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? originTotal.tariff40hc : "NA"}</td>
                   <td></td>
                </tr>
                <tr class="heading">
                   <td colspan="7">Destination Charges</td>
                </tr>
                <tr class="item">
                   <th style="width: 40mm;">Charge Name</th>
                   <th style="width: 15mm;">Currency</th>
                   <th style="width: 20mm;">20'STD</th>
                   <th style="width: 25mm;">40'STD</th>
                   <th style="width: 25mm;">40'HC</th>
                   <th>Note</th>
                </tr>
                ${charges
      .filter(charge => destinationChargeTypes.includes(charge.charge_type?.toLowerCase()))
      .map((charge) => `
                <tr class="item">
                   <td>${charge.charge_name}</td>
                   <td>${charge.currency}</td>
                   <td>${myQuotation?.tariff20 > 0 ? charge.tariff_20 : "NA"}</td>
                   <td>${myQuotation?.tariff40 > 0 ? charge.tariff_40 : "NA"}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? charge.tariff_40hc : "NA"}</td>
                   <td></td>
                </tr>
                `).join("")}
                <tr class="heading">
                   <td style="width: 40mm;">Total </td>
                   <td>USD</td>
                   <td>${myQuotation?.tariff20 > 0 ? destinationTotal.tariff20 : "NA"}</td>
                   <td>${myQuotation?.tariff40 > 0 ? destinationTotal.tariff40 : "NA"}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? destinationTotal.tariff40hc : "NA"}</td>
                   <td></td>
                </tr>
                <tr class="item">
                   <th style="width: 40mm;"></th>
                   <th style="width: 15mm;">Currency</th>
                   <th style="width: 20mm;">20'STD</th>
                   <th style="width: 25mm;">40'STD</th>
                   <th style="width: 25mm;">40'HC</th>
                   <th>Note</th>
                </tr>
                <tr class="heading">
                <td style="font-weight:bold;">Containers : </td>
                <td></td>
                <td>${myQuotation?.tariff20}</td>
                <td>${myQuotation?.tariff40}</td>
                <td>${myQuotation?.tariff40hc}</td>
               
                <td></td>
                </tr>
                <tr>
                   <td style="font-weight:bold;">Grand Total</td>
                   <td style="font-weight:900; font-size:medium;">${toRoundedFixed(
         parseFloat(myQuotation?.tariff20 > 0 ? (calcChargeWithCommission(quotation.tariff_20, myQuotation.commission20ft) + destinationTotal.tariff20 + myQuotation.additional_charges_20 + originTotal.tariff20) * myQuotation?.tariff20 : `0`) + parseFloat(myQuotation?.tariff40 > 0 ? (calcChargeWithCommission(quotation.tariff_40, myQuotation.commission40ft) + destinationTotal.tariff40 + myQuotation.additional_charges_40 + originTotal.tariff40) * myQuotation?.tariff40 : `0`) + parseFloat(myQuotation?.tariff40hc > 0 ? (calcChargeWithCommission(quotation.tariff_40hc, myQuotation.commission40hc) + destinationTotal.tariff40hc + myQuotation.additional_charges_40hc + originTotal.tariff40hc) * myQuotation?.tariff40hc : `0`)
      )
   }</td>
                   <td>${myQuotation?.tariff20 > 0 ? (calcChargeWithCommission(quotation.tariff_20, myQuotation.commission20ft) + destinationTotal.tariff20 + myQuotation.additional_charges_20 + originTotal.tariff20) * myQuotation?.tariff20 : `NA`}</td>
                   <td>${myQuotation?.tariff40 > 0 ? (calcChargeWithCommission(quotation.tariff_40, myQuotation.commission40ft) + destinationTotal.tariff40 + myQuotation.additional_charges_40 + originTotal.tariff40) * myQuotation?.tariff40 : `NA`}</td>
                   <td>${myQuotation?.tariff40hc > 0 ? (calcChargeWithCommission(quotation.tariff_40hc, myQuotation.commission40hc) + destinationTotal.tariff40hc + myQuotation.additional_charges_40hc + originTotal.tariff40hc) * myQuotation?.tariff40hc : `NA`}</td>

                   <td>USD (converted as per the present conversion)</td>
                </tr>
                <tr>
                   <td colspan="7" class="note">
                      <b>Remark:</b>
                      <p>Offer Expires At:  <span> ${getAffterSevenDayDate()}</span></p>
                      <p>Our quotation is valid until the above mentioned offer expiry date. We reserve the  right to review and re-quote, if we do not receive any booking nor your  rate acceptance confirmation, prior to above mentioned offer expiry date.  Unless otherwise specified, all rates are subject to all surcharges as they are valid at the time of shipment. The current applicable surcharges are mentioned in the origin and destination charges. The Quotation may be subject to local charges and service feeThe quotation is subject to space and equipment availability and subject to compliance by you with all applicable cargo weight restrictions and regulations.</p>
                   </td>
                </tr>
                <tr>
                   <td colspan="7" class="note">
                      <br />
                      <b>Yours Sincerely,</b><br />
                      ${user.first_name} ${user.last_name || 'Kuulie'}
                   </td>
                </tr>
             </table>
          </div>
       </body>
    </html>
`;

module.exports = getMyQuotationPDFHTML;