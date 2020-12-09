const { consumeQueue, sendToQueue } = require("../services/amqp.service");
const executionManager = require("../execution-manager");


function processRequest(executionRequest, ackMessage) {
    const executionResult = await executionManager.execute(executionRequest);
    const results = await sendToQueue(process.env.AMQP_RESULT_QUEUE, Buffer.from(executionResult));

    if (results) {
        ackMessage();
    } else {
        //TODO error handling
    }
}

module.exports = async () => {
    return consumeQueue(`${process.env.AGENT_KEY}-queue`, processRequest);
}