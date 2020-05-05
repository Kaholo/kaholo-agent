const winston = require("winston");

const pluginsService = require("../services/plugins.service");
const BaseController = require("../models/base-controller.model");

class PluginsController extends BaseController{
    
    async _handleReuqest(promise, req,res){
        try{
            await promise;
            res.status(204).send();
        } catch (err){
            res.status(500).send(err)
        }
    }

    async install(req,res){
        winston.info("Installing plugin");    
        await this._handleReuqest(pluginsService.install(req.file.path), req,res);
    }

    async delete(req,res){
        winston.info("Deleting plugin");
        await this._handleReuqest(pluginsService.delete(req.body.name), req,res);
    }

    list(req,res){
        return res.json(pluginsService.getVersions())
    }
}

const pluginsController = new PluginsController();

module.exports = pluginsController;