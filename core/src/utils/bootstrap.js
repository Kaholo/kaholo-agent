const fs = require("fs");

const mkdirp = require("mkdirp");
const winston = require('winston');

const environment = require("../environment/environment");
const pluginsLoader = require("../utils/pluginsLoader");
const register = require("../utils/register");


module.exports = {
    bootstrap: (app, agentKey) => {
        if (!fs.existsSync(environment.pluginsPath)) {
            mkdirp.sync(environment.pluginsPath);
        }
        winston.info("Loading plugins modules...");
        pluginsLoader.loadPluginModule(environment.pluginsPath, null);
        winston.info("Finish loading plugins");
        winston.info("Sending key to server");
        register.register(agentKey, environment.server_url, `http://${environment.ip}:${environment.port}`);
    }
};