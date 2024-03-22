const pdf = require("html-pdf");
const { getQuotationHTML } = require('./templates/quotation-html');

const createPDFAsync = (html, options) =>
    new Promise((resolve, reject) => {
        pdf.create(html, options).toBuffer((err, buffer) => {
            if (err !== null) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });

const prepareQuotationHTML = async (data) => {
    return await getQuotationHTML(data);
}

const getQuotationPdf = async (data) => {
    try {
        console.log('******************************* Started => generateQuotationPdf', new Date());
        const html = await prepareQuotationHTML(data);
        console.log('******************************* HTML => generateQuotationPdf', html);
        const buffer = await createPDFAsync(html, {
            format: "A4",
            orientation: "portrait",
            border: {
                top: "0.5in",
                right: "0.5in",
                bottom: "0.5in",
                left: "0.5in",
            },
        });
        console.log('******************************* Ended => generateQuotationPdf', new Date());
        return buffer;
    } catch (e) {
        console.log('******************************* Error => generateQuotationPdf', e);
        throw e;
    }
}

module.exports = {
    getQuotationPdf
}
