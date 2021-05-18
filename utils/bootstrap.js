const fs = require("fs");
const logger = require("../api/services/logger");

const pluginsService = require("../api/services/plugins.service");
const socketService = require("../api/services/socket.service");
const amqpService = require("../api/services/amqp.service");
const register = require("../utils/register");

const executionQueueWorker = require("../api/workers/execution-queue.worker");

async function bootstrap() {
  logger.info("Loading plugins modules...");
  try {
    await pluginsService.loadAllInsalledPlugins();
  } catch (error) {
    console.error(error)
  }
  logger.info("Finish loading plugins");
  logger.info("Sending key to server");
  await register.registerAgent();
  logger.info("Agent registered");
  logger.info("Configuring AMQP service");
  amqpService.configure({
    rejectUnauthorized: false,
    cert: fs.readFileSync(`${__dirname}/../../${process.env.AMQP_CERT_PATH}`),
    key: fs.readFileSync(`${__dirname}/../../${process.env.AMQP_KEY_PATH}`)
  });
  logger.info("AMQP service configured");
  logger.info("Connecting to AMQP");
  await amqpService.connectToResults();
  logger.info("Connected to results queue");
  await amqpService.connectToActions(executionQueueWorker);
  logger.info("Connected to actions queue");
  logger.info("Started processing execution queue");
  logger.info("Subscribing to websocket");
  socketService.subscribeToSocket();
  logger.info("Websocket connction estabilished");
};

module.exports = bootstrap;
