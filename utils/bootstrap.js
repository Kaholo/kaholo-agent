const logger = require("../api/services/logger");

const pluginsService = require("../api/services/plugins.service");
const socketService = require("../api/services/socket.service");
const register = require("../utils/register");

module.exports = () => {
  logger.info("Loading plugins modules...");
  pluginsService.loadAllInsalledPlugins().catch(console.error);
  logger.info("Finish loading plugins");
  logger.info("Sending key to server");
  register
    .registerAgent()
    .then(() => {
      socketService.subscribeToSocket();
    })
    .catch(() => {});
};
