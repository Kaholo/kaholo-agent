const configureEnvironment = require("./config/environment");
const configureExpress = require("./config/express");
const bootstrap = require("./utils/bootstrap");

async function startAgent() {
    await configureEnvironment();
    const agentProcess = await configureExpress();
    await bootstrap();
    return agentProcess;
}

if(process.env.NODE_ENV !== "test") {
    startAgent();
}

module.exports = { startAgent };
