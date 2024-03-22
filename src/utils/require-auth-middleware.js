const jwt = require("jsonwebtoken");
const logger = require("../logger/logger");
const { getClientDataById, getUserAccessToken } = require("./redis-service");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = () => {
    return (req, res, next) => {
        const authorizationHeaderString = req.headers["authorization"];
        if (!authorizationHeaderString) {
            return res.status(401).send("Unauthorized access");
        } else {
            const authorizationHeader = authorizationHeaderString.split(' ');
            if (authorizationHeader.length == 2) {
                const scheme = authorizationHeader[0];
                const credentials = authorizationHeader[1];
                if ((/^Bearer$/i.test(scheme)) && credentials) {
                    token = credentials;
                } else {
                    return res.status(401).send("Unauthorized access");
                }
                jwt.verify(token, JWT_SECRET, async (err, decoded) => {
                    let clientId = decoded && decoded.user && decoded.user.client && decoded.user.client.id
                        ? decoded.user.client.id : null;

                    if (req.url?.includes("/dashboard/dashboard/") || req.url?.includes("/dashboard/crone-jobs")) {
                        let param = req.url?.replace("/dashboard/dashboard/", "");
                        param = param?.replace("/dashboard/crone-jobs/", "")?.split("?")[0];
                        if (param) {
                            clientId = param;
                        }
                    }
                    if (err || !clientId) {
                        logger.error(`Error while decoding token ${err}`)
                        return res.status(401).send("Invalid access token");
                    }

                    const currentAccessToken = await getUserAccessToken(decoded.user.id);
                    const isSameAccessToken = currentAccessToken == token;
                    if (currentAccessToken && token && !isSameAccessToken) {
                        logger.error("You have logged in from new location.")
                        return res.status(401).send("You have logged in from new location.");
                    }

                    getClientDataById(clientId).then(client => {
                        if (client && client.dbConnectionString) {
                            if (client.subscription) {
                                req.dbConnectionString = client.dbConnectionString;
                                req.user = decoded.user;
                                next();
                            } else {
                                logger.error(`Your organization do not have any active subscription - ${err}`);
                                return res.status(401).send("Your organization do not have any active subscription.");
                            }
                        } else {
                            logger.error(`No client information ${err}`);
                            return res.status(401).send("No client information");
                        }
                    }).catch((redisError) => {
                        logger.error(`Error while fetching client information ${redisError}`);
                        return res.status(401).send("Error while fetching client information");
                    });
                });
            } else {
                return res.status(401).send("Unauthorized access");
            }
        }
    };
};