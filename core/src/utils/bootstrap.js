const fs = require("fs");

const mkdirp = require("mkdirp");
const winston = require('winston');

const environment = require("../environment/environment");
const pluginsLoader = require("../utils/pluginsLoader");
const register = require("../utils/register");
const publicIp = require('public-ip');
const socketController = require("../api/controllers/socket.controller");

module.exports = {
    bootstrap: (app, agentKey) => {
        if (!fs.existsSync(environment.pluginsPath)) {
            mkdirp.sync(environment.pluginsPath);
        }

        function doBootstrap() {
            winston.info("Loading plugins modules...");
            pluginsLoader.loadPluginModule(environment.pluginsPath, null);
            winston.info("Finish loading plugins");
            winston.info("Sending key to server");
            register.register(
                agentKey,
                environment.server_url,
                `http://${environment.ip}:${environment.port}`,
                `http://${environment.publicIp}:${environment.port}`)
                .then(() => {
                    socketController.subscribeToSocket();
                }).catch(() => {});
        }

        publicIp.v4().then(ip => {
            environment.publicIp = ip;
            doBootstrap();
        }).catch(error => {
            environment.publicIp = environment.ip;
            doBootstrap();
        });


    }
};