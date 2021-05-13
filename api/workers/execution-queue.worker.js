const amqplib = require("../services/amqp.service");
const executionManager = require("../execution-manager");


async function processRequest({ content }) {
  const executionRequest = JSON.parse(content.toString());
  console.info(`Got message from queue, runId: ${executionRequest.runId}, method: ${executionRequest.actionMethod.name} `)
  const executionData = {
    executionId: executionRequest.runId,
    settings: executionRequest.pluginSettings,
    action: {
      plugin: {
        name: executionRequest.plugin.name
      },
      timeout: executionRequest.timeout,
      _id: executionRequest.actionId,
      id: executionRequest.actionId,
      method: {
        name: executionRequest.actionMethod.name
      },
      params: executionRequest.params
    }
  }
  const executionResult = await executionManager.execute(executionData);
  executionResult.actionExecutionId = executionRequest.actionExecutionId;
  executionResult.agentId = executionRequest.agentId;
  executionResult.runId = executionRequest.runId;
  executionResult.actionIndex = executionRequest.actionIndex;
  executionResult.processIndex = executionRequest.processIndex;

  await amqplib.sendToQueue(
    process.env.AMQP_RESULT_QUEUE,
    amqplib.VHOST_RESULTS,
    Buffer.from(JSON.stringify(executionResult))
  );
}

module.exports = async () => {
  return amqplib.consumeQueue(
    `${process.env.AGENT_KEY}`,
    amqplib.VHOST_ACTIONS,
    processRequest
  );
};
