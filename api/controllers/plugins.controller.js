const logger = require("../services/logger");

const pluginsService = require("../services/plugins.service");
const BaseController = require("../models/base-controller.model");

class PluginsController extends BaseController {
  async _handleReuqest(promise, req, res) {
    try {
      await promise;
      res.status(204).send();
    } catch (err) {
      res.status(500).send(err);
    }
  }

  async install(req, res) {
    logger.info("Installing plugin");
    await this._handleReuqest(pluginsService.install(req.file.path), req, res);
  }

  async delete(req, res) {
    logger.info("Deleting plugin");
    await this._handleReuqest(pluginsService.delete(req.body.name), req, res);
  }

  async getAutocompleteFromFunction(req, res) {
    logger.info("Getting autocomplete from plugin function");
    let autocomplete;
    let { actionParams, pluginSettings } = req.body;
    if (!actionParams || !Array.isArray(actionParams)) {
      actionParams = [];
    }
    if (!pluginSettings || !Array.isArray(pluginSettings)) {
      pluginSettings = [];
    }
    try {
      autocomplete = await pluginsService.getAutocompleteFromFunction(
        req.params.pluginName,
        req.params.functionName,
        req.body.query,
        pluginSettings,
        actionParams
      );
      res.status(200).json(autocomplete);
    } catch (err) {
      console.error(err);
      const errMessage = typeof err === "string" ? err : err.message;
      res.status(500).json({ message: errMessage });
    }
  }

  list(req, res) {
    return res.json(pluginsService.getVersions());
  }
}

const pluginsController = new PluginsController();

module.exports = pluginsController;
