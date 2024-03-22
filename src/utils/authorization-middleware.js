const jwt = require("jsonwebtoken");
const config = require("../config/config");
const logger = require("../logger/logger");

module.exports = (credentials = []) => {
    return (req, res, next) => {
        // Allow for a string OR array
        if (typeof credentials === "string") {
            credentials = [credentials];
        }

        // Find JWT in Headers
        const token = req.headers["authorization"];
        if (!token) {
            return res.status(401).send("Sorry pal: access denied");
        } else {
            // Validate JWT
            // Bearer yndujsoIn...
            const tokenBody = token.split(" ");
            jwt.verify(tokenBody[2], config.JWT_SECRET, (err, decoded) => {
                if (err) {
                    logger.error(`Error while fetching JWT token ${err}`)
                    return res.status(401).send("Error: Access Denied");
                }
                // Check for credentials being passed in
                if (credentials.length > 0) {
                    if (
                        decoded.scopes &&
                        decoded.scopes.length &&
                        credentials.some(cred => decoded.scopes.indexOf(cred) >= 0)
                    ) {
                        next();
                    } else {
                        return res.status(401).send("Error: Access Denied");
                    }
                } else {
                    // No credentials required, user is authorized
                    next();
                }
            });
        }
    };
};