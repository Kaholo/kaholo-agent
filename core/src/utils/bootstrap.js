const fs = require("fs");

const mkdirp = require("mkdirp");
const winston = require('winston');

const environment = require("../environment/environment");
const pluginsLoader = require("../utils/pluginsLoader");


module.exports = {
    bootstrap: (app) => {
        if (!fs.existsSync(environment.pluginsPath)) {
            mkdirp.sync(environment.pluginsPath);
        }
        winston.info("Loading plugins modules...");
        pluginsLoader.loadPluginModule(environment.pluginsPath, null);
        winston.info("Finish loading plugins");
    }
};