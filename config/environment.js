const path = require("path");
const fs = require("fs");
const mkdirp = require('mkdirp');

const os = require("os");
const dotenv = require("dotenv");

const BASE_DIR = path.dirname(__dirname);
const CONF_FILE_NAME = "kaholo-agent.conf";

const defaultConfPath = `/etc/kaholo-agent/${CONF_FILE_NAME}`;
const localConfPath = path.join(BASE_DIR, CONF_FILE_NAME);

module.exports = async function(){
    
    //Load conf file
    const defaultConfExist = fs.existsSync(defaultConfPath);
    let configLoadResult;
    if(defaultConfExist){
        configLoadResult = dotenv.config({path : defaultConfPath});
    } else if (fs.existsSync(localConfPath)) {
        configLoadResult = dotenv.config({path: localConfPath});
    }

    if (configLoadResult && configLoadResult.error) {
        console.error("Could not load configuration file:");
        throw configLoadResult.error
    }

    const defaultConf = {
        SERVER_URL: "http://localhost:3000"
    };
    //apply default variables
    for(const key in defaultConf){
        if(!process.env[key]){
            process.env[key] = defaultConf[key];
        }
    }

    if(!process.env.AGENT_KEY){
        throw "Missing AGENT_KEY environment variabe.";
    }

    process.env.BASE_DIR = BASE_DIR;

    if(!process.env.PLUGINS_DIR_PATH) {
        process.env.PLUGINS_DIR_PATH = path.join(BASE_DIR, 'libs', 'plugins');
    }

    process.env.AGENT_NAME = process.env.AGENT_NAME || os.hostname().replace(".", "") + '-' + process.platform.replace(".", "");

    createPaths();
}

function createPaths(){
    if (!fs.existsSync(process.env.PLUGINS_DIR_PATH)) {
        mkdirp.sync(process.env.PLUGINS_DIR_PATH);
    }
}
