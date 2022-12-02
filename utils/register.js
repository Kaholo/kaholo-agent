const osu = require('node-os-utils');
const { rpcRequest, VHOST } = require("@kaholo/shared")
const pluginsService = require("../api/services/plugins.service");
const { generateKeys } = require("./crypto");

const sendStatusToBigBird = async () => {
    try {
        await rpcRequest({
            requestQueue: "Bigbird/Twiddlebug/Status",
            requestVhost: VHOST.RESULTS,
            responseVhost: VHOST.ACTIONS,
            requestData: {
                key: process.env.AGENT_KEY,
                usedCpuPercentage: await osu.cpu.usage(),
                usedMemPercentage: (await osu.mem.info()).usedMemPercentage,
            }
        })
    } catch (error) {
        console.error("Error during sending RPC Bigbird/Twiddlebug/Status event", error);
    }

}

module.exports.registerAgent = async function() {
    try {
        const { publicKey } = generateKeys();

        await rpcRequest({
            requestQueue: "Bigbird/Twiddlebug/Register",
            requestVhost: VHOST.RESULTS,
            responseVhost: VHOST.ACTIONS,
            requestData: {
                key: process.env.AGENT_KEY,
                name: process.env.AGENT_NAME,
                installedPlugins: pluginsService.getVersions(),
                attributes: process.env.TAGS ? process.env.TAGS.split(',') : [],
                publicKey,
            },
            retries: 3
        });
        await sendStatusToBigBird();
    } catch (error) {
        console.error("Error during registering agent", error);
        process.exit(9);
    }

    setInterval(sendStatusToBigBird, 5000)
}
