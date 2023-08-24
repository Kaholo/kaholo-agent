const { eventsWorker, AgentTypeEnum, VHOST } = require("@kaholo/shared");
const pluginsService = require("../api/services/plugins.service");
const { generateKeys } = require("./crypto");

module.exports.registerAgent = async function () {
  try {
    const { publicKey } = generateKeys();
    if (process.env.DYNAMIC_AGENT === "true") {
      await eventsWorker.publish({
        vhost: VHOST.RESULTS,
        queue: "AgentsManager/Register",
        event: {
          inputData: {
            type: AgentTypeEnum.DYNAMIC,
            key: process.env.AGENT_KEY,
            installedPlugins: pluginsService.getVersions(),
            publicKey,
          },
        },
      });
    } else {
      await eventsWorker.publish({
        vhost: VHOST.RESULTS,
        queue: "Bigbird/Twiddlebug/Register",
        event: {
          inputData: {
            key: process.env.AGENT_KEY,
            name: process.env.AGENT_NAME,
            installedPlugins: pluginsService.getVersions(),
            attributes: process.env.TAGS ? process.env.TAGS.split(",") : [],
            publicKey,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error during registering agent", error);
    process.exit(9);
  }
};
