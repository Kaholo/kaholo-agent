const winston = require("winston");

const environment = require('../../environment/environment');
const pluginsLoader = require('../../utils/pluginsLoader');
const packgify = require('../../utils/packgify');
const pluginsService = require("../services/plugins.service");




module.exports = {
    /* get a plugin file and install it */
    install: (req, res) => {
        //get plugin config file
        if (!req.body.key || environment.key !== req.body.key) {
            return res.status(500).send("Invalid key");
        }
        winston.info("Installing plugin");

        pluginsService.install(req.file.path).then(() => {
            return res.status(204).send();
        }).catch (error => {
            winston.error("Error installing plugin: ", error);
            return res.status(500).send(error);
        })

    },
    /* list plugins */
    list: (req, res) => {
        const modules = packgify.packagify(pluginsLoader.module_holder);
        return res.json(modules);
    }
};
