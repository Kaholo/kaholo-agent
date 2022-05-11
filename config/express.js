const http = require('http');
const express = require("express");
const bodyParser = require("body-parser");
const expressWinston = require("express-winston");

const consoleTransport = require("../api/services/logger-transport");
const logger = require("../api/services/logger");

const statusApi = require("../api/routes/status.routes");
const pluginsApi = require("../api/routes/plugins.routes");
const executionApi = require("../api/routes/execution.routes");

module.exports = function () {
  const app = express();

  //////////////////////
  /// configuration ///
  ////////////////////

  app.use(
    bodyParser.urlencoded({
      extended: true,
      // only passing as string prevents default value
      limit: "null",
      parameterLimit : 1000000
    })
  );
  app.use(bodyParser.json({limit: "null"}));
  app.use(
    expressWinston.logger({
      transports: [
        consoleTransport
      ],
      meta: false, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      ignoreRoute: function (req, res) {
        return "/api/status" === (req.originalUrl || req.url);
      }, // optional: allows to skip some log messages based on request and/or response
    })
  );

  // middleware to check request key
  app.post("*", function (req, res, next) {
    if(process.env.NODE_ENV === "test") {
      return next();
    }
    const key = req.body ? req.body.key : null;
    if (req.url === "/api/plugins/install") {
      return next();
    }
    if (!key) {
      return res.status(500).send("No key was provided");
    }
    if (key !== process.env.AGENT_KEY) {
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
  app.use("/api/status", statusApi);
  app.use("/api/plugins", pluginsApi);
  app.use("/api/task", executionApi);

  /* sending 404 to all uncatched requests */
  app.use("*", function (req, res, next) {
    return res.status(404).send();
  });

  const server = http.createServer(app);
  server.setTimeout(3600000);

  return new Promise(resolve => {
    server.listen(process.env.PORT, () => {
      logger.info(`Listening on localhost:${process.env.PORT}`);
      resolve(server)
    });
  });

};
