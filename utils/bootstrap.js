const logger = require("../api/services/logger");

const pluginsService = require("../api/services/plugins.service");
const { eventsWorker, VHOST } = require("@kaholo/shared");
const register = require("./register");

const initConsumers = require("../api/consumers");

async function bootstrap() {
  logger.info("Loading plugins modules...");
  try {
    await pluginsService.loadAllInstalledPlugins();
  } catch (error) {
    console.error("Error during loading plugins:", error)
  }
  logger.info("Finish loading plugins");
  logger.info("Configuring AMQP service");
  await eventsWorker.init({}, [VHOST.ACTIONS, VHOST.RESULTS]);
  logger.info("Connected to vhosts");

  logger.info("Registering agent in server");
  // This promise cannot be awaited here, because it would block the bootstrap process
  const registerPromise = register.registerAgent();

  logger.info("Configuring consumers");
  await initConsumers();
  await eventsWorker.connectConsumers();
  logger.info("Consumers configured");

  await registerPromise;
  logger.info("Agent started");
}

module.exports = bootstrap;
