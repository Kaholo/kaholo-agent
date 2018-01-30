const winston = require("winston");

const environment = require('../../environment/environment');
const pluginsService = require("../services/plugins.service");


function packagify(modules) {
    // returns an object where key's value is the version of the plugin.
    return Object.keys(moduleLoader.modules).reduce((total, current) => {
        total[current] = moduleLoader.modules[current].version;
        return total;
    }, {});
}



module.exports = {
    /* get a plugin file and install it */
    install: (req, res) => {
        //get plugin config file
        if (!req.body.key || environment.key !== req.body.key) {
            return res.status(500).send("Invalid key");
        }
        winston.info("Installing plugin");

        pluginsService.install(req.file.path).then(() => {
            console.log("Finish installing plugin")
            return res.status(204).send();
        }).catch (error => {
            winston.error("Error installing plugin: ", error);
            return res.status(500).send(error);
        })

    },
    /* list plugins */
    list: (req, res) => {
        const modules = packagify(modules_holder);
        return res.json(modules);
    }
};
