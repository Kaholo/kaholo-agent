const executionManager = require("../execution-manager");
const logger = require("../services/logger");
const { getCloneExecutionData } = require("../services/actions/clone.service");

async function processExecutionRequest(executionRequest, { publish }) {
  logger.info(`Start processing action "${executionRequest.actionExecutionId}"`);
  let executionData;

  switch (executionRequest.type) {
    case "clone":
      executionData = getCloneExecutionData(executionRequest);
      break;
    case "plugin":
    default:
      executionData = {
        pipelineExecutionId: executionRequest.pipelineExecutionId,
        runId: executionRequest.runId,
        settings: executionRequest.pluginSettings || {},
        action: {
          plugin: {
            name: executionRequest.plugin?.name,
            version: executionRequest.plugin?.version
          },
          timeout: executionRequest.timeout,
          _id: executionRequest.actionId,
          id: executionRequest.actionId,
          method: {
            name: executionRequest.actionMethod.name
          },
          params: executionRequest.params,
          actionExecutionId: executionRequest.actionExecutionId,
        }
      };
  }

  const executionResult = await executionManager.execute(executionData);
  executionResult.agentKey = process.env.AGENT_KEY;
  executionResult.actionExecutionId = executionRequest.actionExecutionId;
  executionResult.pipelineExecutionId = executionRequest.pipelineExecutionId;
  executionResult.pipelineId = executionRequest.pipelineId;
  executionResult.actionId = executionRequest.actionId;

  try {
    logger.info(`Sending result of action "${executionRequest.actionExecutionId}"`);
    await publish({
      vhost: "results",
      event: {
        initQueue: process.env.AMQP_RESULT_QUEUE || "Action/Execution/TwiddlebugResult",
        inputData: executionResult,
      },
    });
  } catch (error) {
    logger.error(`Error during sending result of action "${executionRequest.actionExecutionId}"`);
    logger.error(error);
  }

}

module.exports = processExecutionRequest;
