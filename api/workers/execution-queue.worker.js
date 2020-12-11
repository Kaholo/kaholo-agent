const { consumeQueue, sendToQueue, VHOST_ACTIONS } = require("../services/amqp.service");
const executionManager = require("../execution-manager");


async function processRequest(executionRequest) {
    const executionResult = await executionManager.execute(executionRequest);
    await sendToQueue(process.env.AMQP_RESULT_QUEUE, Buffer.from(executionResult));
}

module.exports = async () => {
    return consumeQueue(`${process.env.AGENT_KEY}-queue`, VHOST_ACTIONS, processRequest);
}