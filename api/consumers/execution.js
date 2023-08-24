const { flowConsumer, VHOST, eventsWorker } = require("@kaholo/shared");
const executionsManager = require("../execution-manager");
const processExecutionRequest = require("../workers/execution-queue.worker");
const pluginsService = require("../services/plugins.service");

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
    queue: "Twiddlebug/Execution/Prepare/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: () => {
      return {
        agentKey: process.env.AGENT_KEY,
        installedPlugins: pluginsService.getVersions(),
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
