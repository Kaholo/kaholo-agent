const initRegisterConsumer = require("./register");
const initExecutionConsumer = require("./execution");
const initAutocompleteConsumer = require("./autocomplete.consumer");
const initPluginConsumers  = require("./plugins");

async function initConsumers() {
    await initRegisterConsumer();
    await initExecutionConsumer();
    await initAutocompleteConsumer();
    await initPluginConsumers()
}

module.exports = initConsumers;
