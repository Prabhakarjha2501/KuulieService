require('dotenv').config();
const logger = require('../../logger/logger');
const axios = require('axios');
const { INTERNAL_SERVER_ERROR, OK } = require('../../utils/apiStatus');
const API_URL = process.env.TRACKANDTRACE_API_URL;
const API_KEY = process.env.TRACKANDTRACE_API_KEY;
const headers = {
    'x-api-key': API_KEY
}
const { tnt } = require('./../../../resources/dummyData');
const { sendMail } = require('../../utils/email/email');
const { trackAndTraceStatus } = require('../../utils/email/templates/trackAndTraceStatus');
const { kuulieLogo } = require('../../utils/image-constants');
const { getCurrentClientData } = require('../dashboard/dashboard.service');

const trackAndTraceBillOfLoadingResult = async (req, res) => {
    const { containerNumber, carrierNumber, blNumber } = req.body;
    let createBookmarkRequest;
    const isBLFlow = !!blNumber;
    if (isBLFlow) {
        createBookmarkRequest = {
            carrier_no: carrierNumber,
            doc_no: blNumber,
            doc_type: "BL"
        };
    } else {
        createBookmarkRequest = {
            carrier_no: carrierNumber,
            cntr_no: containerNumber
        };
    }

    if (containerNumber == 'TLLU1181321' && carrierNumber == 'ONEY') {
        res.status(200).send(tnt?.obj);
        const result = req.body;
        const clientId = req?.user?.client?.id
        const userAdminData = await axios.get(`${process.env.AUTH_API_URL}/api/users/admins/${clientId}`,
            { headers: { Authorization: req.headers.authorization } });
        const data = userAdminData?.data?.data;
        const mailAdminBodyHTML = trackAndTraceStatus(result, containerNumber, carrierNumber);
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
                "Kuulie | Track Status",
                mailAdminBodyHTML,
                "",
                attachments
            );
        }
        return res.status(OK).send({});
    } else {
        try {
            const option = {
                method: 'POST',
                url: `${API_URL}eta/${isBLFlow ? 'booking' : 'container-bookmarks'}`,
                validateStatus: function (status) {
                    return status >= 200 && status < 300 || status == 409
                },
                data: createBookmarkRequest,
                headers: headers
            };

            const createBookmarkResponse = await axios(option);
            if ((createBookmarkResponse.status == 409 || createBookmarkResponse.status == 200)
                && createBookmarkResponse.data.response) {
                const bookmarkId = createBookmarkResponse.data.response[0].obj?.id || createBookmarkResponse.data.response[0].previous_ids[0];
                const url = API_URL + `eta/tracking/${isBLFlow ? 'bill-of-lading' : 'container'}-bookmarks/${bookmarkId}`;
                const getBookmarkResponse = await axios.get(url, { headers: headers });
                res.status(200).send(getBookmarkResponse?.data?.obj);
            } else {
                res.status(INTERNAL_SERVER_ERROR).send({ message: "Internal server error" });
            }
        } catch (err) {
            console.error(err);
            res.status(INTERNAL_SERVER_ERROR).send({ message: err?.response?.data?.message || "Internal server error" });
        }
    }
}


module.exports = {
    trackAndTraceBillOfLoadingResult
};