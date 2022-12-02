const { flowConsumer, VHOST, eventsWorker } = require("@kaholo/shared");
const executionsManager = require("../execution-manager");
const processExecutionRequest = require("../workers/execution-queue.worker");

async function initExecutionConsumer() {
  await flowConsumer({
    queue: "Twiddlebug/Execution/Cancel/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: async (event) => {
      const killedAction = executionsManager.killAction(event.runId);
      return {
        killedAction,
      };
    },
  });

  await flowConsumer({
    queue: "Twiddlebug/Execution/Start/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: processExecutionRequest,
  });
}

module.exports = initExecutionConsumer;
