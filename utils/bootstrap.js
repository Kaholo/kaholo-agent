const logger = require("../api/services/logger");

const pluginsService = require("../api/services/plugins.service");
const socketService = require("../api/services/socket.service");
const amqpService = require("../api/services/amqp.service");
const register = require("../utils/register");

const executionQueueWorker = require("../api/workers/execution-queue.worker");

module.exports = async () => {
  logger.info("Loading plugins modules...");
  pluginsService.loadAllInsalledPlugins().catch(console.error);
  logger.info("Finish loading plugins");
  logger.info("Sending key to server");
  await register.registerAgent();
  logger.info("Agent registered");
  logger.info("Connecting to AMQP");
  await amqpService.connectToResults();
  logger.info("Connected to results queue");
  await amqpService.connectToActions();
  logger.info("Connected to actions queue");
  logger.info("Subscribing to websocket");
  socketService.subscribeToSocket();
  logger.info("Websocket connction estabilished");
  await executionQueueWorker();
  logger.info("Started processing execution queue");
};
