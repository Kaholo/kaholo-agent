const logger = require("../services/logger");
const pluginsService = require("../services/plugins.service");

async function processAutocompleteRequest({ requestData: autocompleteRequest }) {
    logger.info("Getting autocomplete from plugin function");
    let autocompleteResult;
    let { actionParams, pluginSettings, pluginName, pluginVersion, functionName, query } = autocompleteRequest;
    if (!actionParams || !Array.isArray(actionParams)) {
      actionParams = [];
    }
    if (!pluginSettings || !Array.isArray(pluginSettings)) {
      pluginSettings = [];
    }

    try {
      autocompleteResult = await pluginsService.getAutocompleteFromFunction(
        pluginName,
        pluginVersion,
        functionName,
        query,
        pluginSettings,
        actionParams
      );

      logger.info("Sending autocomplete result");
      return {
          ok: true,
          responseData: {
              autocompleteResult
          }
      }
    } catch (err) {
      console.error('Error in autocomplete function:',err);
      const error = typeof err === "string" ? err : err.message;
      return {
          ok: false,
          responseData: {
              error
          }
      }
    }
}

module.exports = processAutocompleteRequest;
