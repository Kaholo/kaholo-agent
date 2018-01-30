const express = require("express");
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');

const winston = require('winston');
const expressWinston = require('express-winston');
const parseArgs = require('minimist')(process.argv.slice(2));

const environment = require("./environment/environment");


if (!fs.existsSync(environment.keyPath)) {
    const createKey = require("./utils/createKey");
    createKey.generateKey(environment.keyPath);
}

const app = express();

const PORT = (parseArgs.PORT || 8090);

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        })
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
}));




app.listen(PORT, () => console.log(`Agent listening on port ${PORT}`));