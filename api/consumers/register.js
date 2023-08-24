const { VHOST, flowConsumer, eventsWorker } = require("@kaholo/shared");
const osu = require("node-os-utils");
const logger = require("../services/logger");

const STATUS_TTL = 1000 * 60;
let statusIntervalRegistered = false;

const sendStatusToBigBird = async () => {
  try {
    await eventsWorker.publish({
      vhost: VHOST.RESULTS,
      queue: "AgentsManager/Status",
      event: {
        inputData: {
          key: process.env.AGENT_KEY,
          usedCpuPercentage: await osu.cpu.usage(),
          usedMemPercentage: (await osu.mem.info()).usedMemPercentage,
        },
      },
      opts: {
        expiration: STATUS_TTL,
      },
    });
  } catch (error) {
    console.error("Error during sending status event", error);
  }
}

module.exports = async function initRegisterConsumer() {
  await flowConsumer({
    queue: "Twiddlebug/Register/Finish/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: async () => {
      if (statusIntervalRegistered) {
        logger.info(`Agent received redundant "Twiddlebug/Register/Finish/{agentKey}" message.`);
        return;
      }
      await sendStatusToBigBird();
      setInterval(sendStatusToBigBird, 5000);
      statusIntervalRegistered = true;

      // This log needs to stay exactly as it is at the end of the initialization because integration tests wait for this message
      logger.info("Agent installed successfully.");
    },
  });
};
