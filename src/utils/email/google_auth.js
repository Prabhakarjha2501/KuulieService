/**
 * Module with utilities for generating Access Tokens to Google's API services.
 * @module config/google_auth
 */

var googleAuth = require('google-auth-library');
var scope = "https://mail.google.com/";

/**
 * ======================================================================================================================
 * Step 0: Create OAuth2 credentials at the Google Console (make sure to download JSON, not only just get key and secret)
 * ======================================================================================================================
 */

/**
 * The JSON credentials you got from your Google Console
 * 
 * @type { object }
 * */
var projectCredentials = {
	"web": {
		"client_id": "430796809157-0q6h2lm4tr0hpge94hi0cfdc2pc8g7bq.apps.googleusercontent.com",
		"project_id": "quickstart-1612775095200",
		"auth_uri": "https://accounts.google.com/o/oauth2/auth",
		"token_uri": "https://accounts.google.com/o/oauth2/token",
		"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
		"client_secret": "F7sxocwT2JyflgKt4bNG2zrU",
		"redirect_uris": ["http://localhost"],
		"javascript_origins": ["http://localhost"]
	}
};

/** Exporting the project credentials for the Nodemailer configuration for later */
module.exports.credentials = projectCredentials;

/**
 * ================================
 * Step 1: Authorize in the browser
 * ================================
 */

/**
 * This callback is for getAuthorizeUrl(), which returns a possible error, or a URL.
 * 
 * @callback authorizeCallback
 * @param {( Error | null )} authorizeError
 * @param { string } authorizeUrl
 */

/**
 * Generates a URL that you can visit in your browser.
 * 
 * @param { authorizeCallback } callback - Returns a possible error, or a URL.
 */

module.exports.getAuthorizeUrl = function(callback) {
	if(typeof callback !== 'function') { throw new TypeError("Wrong argument type in google_auth.authorize(). Function expected, " + typeof callback + " recieved."); }

	var oauth2Client = new googleAuth.OAuth2Client(exports.credentials.web.client_id, exports.credentials.web.client_secret, exports.credentials.web.redirect_uris[0]);

	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: scope
	});

	callback(null, authUrl);
}

/**
 * ======================
 * Step 2: Get auth token
 * ======================
 */

/**
 * Paste in your one-time use authorization code here
 * 
 * @type { string }
 */
var code = "4/0AY0e-g6I4hMBA1LTmgPR02v-UrnXLokIwvLFLfpu9iq2xfn5IwCO75XrgnhXTGKjpfeySA";

/**
 * This callback is for getAccessToken(), which returns a possible error, or a URL.
 * 
 * @callback tokenCallback
 * @param {( Error | null )} tokenError
 * @param { object } credentials
 */

/**
 * Generates a URL that you can visit in your browser.
 * 
 * @param { tokenCallback } callback - Returns a possible error, or your API credentials.
 */

module.exports.getAccessToken = function(callback) {
	var oauth2Client = new googleAuth.OAuth2Client(exports.credentials.web.client_id, exports.credentials.web.client_secret, exports.credentials.web.redirect_uris[0]);

	oauth2Client.getToken(code, function(err, token) {
		if(err) return console.log(err);

		callback(null, token);
	});
}

/**
 * ==================================================================
 * Step 3: Save access and refresh tokens as an export for Nodemailer
 * ==================================================================
*/

/**
 * Paste your credentials here as this object.
 * 
 * @type { object }
 */
module.exports.tokens = {
	access_token: 'ya29.a0AfH6SMBSlUJSzhLVT0dP0NjeczrWW1OjqmDRGf685wacPPRHXGCOqQjZKxsArlk4sPYATg0QUgcNXsQ_aSzmVU82KmjXn8UHtVZDfeRLzhSL3sYAaa3U1si_PsZLLMSwlozkCctf6wyre419O-L-sP-2IQnU5s3FwoGE9wOxGbk',
	token_type: 'Bearer',
	refresh_token: '1//0gbpHMi9creI6CgYIARAAGBASNwF-L9Irmsr6I9Gm16IZbSwubzXIw42QyK-Y3JeXNs4ohmSM39PJd20iB4xTkrc04YO8namZFko',
	expiry_date: 1612788524964
};