const configureEnvironment = require("./config/environment");
const bootstrap = require("./utils/bootstrap");

async function startAgent() {
    await configureEnvironment();
    await bootstrap();
}

if(process.env.NODE_ENV !== "test") {
    startAgent();
}

module.exports = { startAgent };
