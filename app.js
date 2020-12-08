const enviormentConfig = require('./config/environment');
const expressConfig = require('./config/express');

const bootstrap = require("./utils/bootstrap");

enviormentConfig().then(()=>{
    return expressConfig();
}).then((serevr)=>{
    bootstrap();
})

