const enviormentConfig = require('./config/environment');
const expressConfig = require('./config/express');

const bootstrap = require("./utils/bootstrap");

await enviormentConfig();
expressConfig();
bootstrap();
