const winston = require("winston");

const pluginsService = require("../api/services/plugins.service");
const socketService = require("../api/services/socket.service");
const register = require("../utils/register");

module.exports = () => {
  winston.info("Loading plugins modules...");
  pluginsService.loadAllInsalledPlugins().catch(console.error);
  winston.info("Finish loading plugins");
  winston.info("Sending key to server");
  register
    .registerAgent()
    .then(() => {
      socketService.subscribeToSocket();
    })
    .catch(() => {});
};
