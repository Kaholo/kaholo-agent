const enviormentConfig = require("./config/environment");
const expressConfig =  require("./config/express");
const bootstrap =  require("./utils/bootstrap");

(async function  () {
    await enviormentConfig();
    await expressConfig();
    await bootstrap();
})();
