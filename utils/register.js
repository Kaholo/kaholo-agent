const { eventsWorker, VHOST } = require("@kaholo/shared")
const pluginsService = require("../api/services/plugins.service");
const { generateKeys } = require("./crypto");

module.exports.registerAgent = async function() {
    try {
        const { publicKey } = generateKeys();
        await eventsWorker.publish({
            vhost: VHOST.RESULTS,
            queue: "Bigbird/Twiddlebug/Register",
            event: {
                inputData: {
                    key: process.env.AGENT_KEY,
                    name: process.env.AGENT_NAME,
                    installedPlugins: pluginsService.getVersions(),
                    attributes: process.env.TAGS ? process.env.TAGS.split(',') : [],
                    publicKey,
                }
            }
        });
    } catch (error) {
        console.error("Error during registering agent", error);
        process.exit(9);
    }
}
