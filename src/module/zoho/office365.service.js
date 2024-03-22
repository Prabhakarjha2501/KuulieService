const msal = require('@azure/msal-node');
const axios = require('axios');

const msalConfig = {
    auth: {
        clientId: process.env.OFFICE365_CLIENT_ID,
        authority: process.env.OFFICE365_AAD_ENDPOINT + process.env.OFFICE365_TENANT_ID,
        clientSecret: process.env.OFFICE365_CLIENT_SECRET,
    }
};

/**
 * With client credentials flows permissions need to be granted in the portal by a tenant administrator.
 * The scope is always in the format '<resource-appId-uri>/.default'. For more, visit: 
 * https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow 
 */
const tokenRequest = {
    scopes: [process.env.OFFICE365_GRAPH_ENDPOINT + '.default'], // e.g. 'https://graph.microsoft.com/.default'
};

const apiConfig = {
    driveDetail: process.env.OFFICE365_GRAPH_ENDPOINT + 'v1.0/users/1e1436a5-b03e-4126-97e2-77360de861ae/drive', // e.g. 'https://graph.microsoft.com/v1.0/users'
    driveById: (driveId) => process.env.OFFICE365_GRAPH_ENDPOINT + 'v1.0/drives/' + driveId + '/root/children', // e.g. 'https://graph.microsoft.com/v1.0/users'
    driveFolderByItemId: (driveId, itemId) => process.env.OFFICE365_GRAPH_ENDPOINT + 'v1.0/drives/' + driveId + '/items/' + itemId + '/children',
    fileContentByItemId: (driveId, itemId) => process.env.OFFICE365_GRAPH_ENDPOINT + 'v1.0/drives/' + driveId + '/items/' + itemId + '/content',
};

/**
 * Initialize a confidential client application. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-confidential-client-application.md
 */
const cca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Acquires token with client credentials.
 * @param {object} tokenRequest 
 */
async function getToken(tokenRequest) {
    return await cca.acquireTokenByClientCredential(tokenRequest);
}

async function callApi(endpoint, accessToken, axiosOptions = {}) {
    const options = {
        ...axiosOptions,
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
    };
    try {
        const response = await axios.default.get(endpoint, options);
        return response.data;
    } catch (error) {
        return error;
    }
};

module.exports = {
    apiConfig: apiConfig,
    tokenRequest: tokenRequest,
    getToken: getToken,
    callApi: callApi
};
