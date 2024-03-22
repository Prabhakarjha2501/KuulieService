// 206710310000185
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const jwt = require("express-jwt");

const jwksRsa = require("jwks-rsa");
const socketio = require("socket.io");
const authConfig = require("./auth_config.json");
const swaggerUi = require('swagger-ui-express'), swaggerDocument = require('../swagger.json');
const requireAuth = require("./utils/require-auth-middleware");
const routes = require('./routers');
const logger = require('./logger/logger');
const { initializeWebsocketConnection } = require('./utils/websocket/websocket');
const { initializeSchedulers } = require('./utils/schedulers');
const { json, urlencoded } = require('express');

const port = process.env.PORT || 5002;

const app = express();

app.use((req, _res, next) => {
    req.io = io;
    next();
});

app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));
app.use(helmet());
app.set("view engine", "pug")

app.use(json({ limit: '100mb', extended: true }));
app.use(urlencoded({ limit: '100mb', extended: true }));

if (
    !authConfig.domain ||
    !authConfig.audience ||
    authConfig.audience === "YOUR_API_IDENTIFIER"
) {
    console.log(
        "Exiting: Please make sure that auth_config.json is in place and populated with valid domain and audience values"
    );
    process.exit();
}

// Swagger configuration
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Validate Request
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
    }),

    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ["RS256"],
});
app.get("/api/external", checkJwt, (req, res) => {
    res.send({
        msg: "Your access token was successfully validated!",
    });
});

app.use('/quotations', express.static('uploads/quotations'));

app.use(requireAuth(), routes);

app.post('/delete/:id', async (req, res) => {
    const id = req.params.id
    const temp = await repo.delete(id)
    res.redirect('/')
})

const dbConnectionString=process.env.DATABASE_URL;
//Start http server
const httpServer = http.createServer(app);
const serverInstance = httpServer.listen(port);
logger.info(`Server listening at port ${port}`);

const io = socketio(serverInstance);
initializeWebsocketConnection(io,dbConnectionString);
 initializeSchedulers();

module.exports = { app };