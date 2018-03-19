const express = require("express");
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');

const winston = require('winston');
const expressWinston = require('express-winston');
const parseArgs = require('minimist')(process.argv.slice(2));

const environment = require("./environment/environment");
const bootstrap = require("./utils/bootstrap");

if (!fs.existsSync(environment.keyPath)) {
    winston.info("Writing pm key");
    const createKey = require("./utils/createKey");
    createKey.generateKey(environment.keyPath);
}

const agentKey = fs.readFileSync(environment.keyPath, 'utf-8');
environment.key = agentKey;

const app = express();

//////////////////////
/// configuration ///
////////////////////

// enable cors
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true
        })
    ],
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
        return '/api/status' === (req.originalUrl || req.url);
    } // optional: allows to skip some log messages based on request and/or response
}));
//
// middleware to check request key

app.post('*', function (req, res, next) {
    const key = req.body ? req.body.key : null;
    if (req.url === "/api/plugins/install") {
        return next();
    }
    if (!key) {
        return res.status(500).send("No key was provided");

    }
    if (key !== agentKey) {
        console.log("Wrong key");
        return res.status(500).send("Wrong key");
    }
    next();
});

app.use((req, res, next) => {
    req.app = app;
    next();
});

//////////////////////
/////// routes //////
////////////////////

/* api references */
const statusApi = require("./api/routes/status.routes");
const pluginsApi = require("./api/routes/plugins.routes");
const executionApi = require("./api/routes/execution.routes");
const socketApi = require("./api/routes/socket.routes");

app.use('/api/status', statusApi);
app.use('/api/plugins', pluginsApi);
app.use('/api/task', executionApi);
app.use('/api/socket', socketApi);


/* sending 404 to all uncatched requests */
app.use('*', function (req, res, next) {
    return res.status(404).send();
});

const server = http.createServer(app);

server.listen(environment.port, () => {
    console.log(`Running on localhost:${environment.port}`);
    bootstrap.bootstrap(app, agentKey);
});

