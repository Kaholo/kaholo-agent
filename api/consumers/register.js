const { VHOST, flowConsumer, eventsWorker } = require("@kaholo/shared");
const osu = require("node-os-utils");
const logger = require("../services/logger");

const sendStatusToBigBird = async () => {
  try {
    await eventsWorker.publish({
      vhost: VHOST.RESULTS,
      queue: "Bigbird/Twiddlebug/Status",
      event: {
        inputData: {
          key: process.env.AGENT_KEY,
          usedCpuPercentage: await osu.cpu.usage(),
          usedMemPercentage: (await osu.mem.info()).usedMemPercentage,
        }
      }
    });
  } catch (error) {
    console.error("Error during sending RPC Bigbird/Twiddlebug/Status event", error);
  }
}

module.exports = async function initRegisterConsumer() {
  await flowConsumer({
    queue: "Twiddlebug/Register/Finish/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: async () => {
      await sendStatusToBigBird();
      setInterval(sendStatusToBigBird, 5000);

      // This log needs to stay exactly as it is at the end of the initialization because integration tests wait for this message
      logger.info("Agent installed successfully.");
    },
  });
};
