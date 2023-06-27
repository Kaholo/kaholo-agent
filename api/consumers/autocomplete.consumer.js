const { flowConsumer, VHOST } = require("@kaholo/shared");
const processAutocompleteRequest = require("../workers/autocomplete.worker");

async function initAutocompleteConsumer() {
    await flowConsumer({
        queue: "Twiddlebug/Autocomplete/Function/{agentKey}",
        queueParams: { agentKey: process.env.AGENT_KEY },
        vhost: VHOST.ACTIONS,
        callback: processAutocompleteRequest
    });
}

module.exports = initAutocompleteConsumer;
