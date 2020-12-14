const amqplib = require("../services/amqp.service");
const executionManager = require("../execution-manager");


async function processRequest(executionRequest) {
    const executionResult = await executionManager.execute(executionRequest);
    await amqplib.sendToQueue(process.env.AMQP_RESULT_QUEUE, amqplib.VHOST_RESULTS, Buffer.from(JSON.stringify(executionResult)));
}

module.exports = async () => {
    return amqplib.consumeQueue(`${process.env.AGENT_KEY}-queue`, amqplib.VHOST_ACTIONS, processRequest);
}
