const configureEnvironment = require("./config/environment");
const bootstrap = require("./utils/bootstrap");
const fs = require("fs");

async function startAgent() {
    await configureEnvironment();
    await bootstrap();
    if (!fs.existsSync("./workspace")) {
        fs.mkdirSync("./workspace", { recursive: true });
    }
    process.chdir("./workspace");
}

if(process.env.NODE_ENV !== "test") {
    startAgent();
}

process.on('uncaughtException', (err) => {
    console.error("UncaughtException:", err);
})

module.exports = { startAgent };
