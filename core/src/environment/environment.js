const path = require("path");

const os = require("os");
const ip = require('ip');
const parseArgs = require('minimist')(process.argv.slice(2));

const config = require("../../../config/config");

const BASE_DIR = path.dirname(path.dirname(path.dirname(__dirname)));

const paths = {
    keyPath: path.join(BASE_DIR, 'config', 'key.pm'),
    pluginsPath: path.join(BASE_DIR, 'libs', 'plugins'),
    tmpPath: path.join(BASE_DIR, 'tmp')
};

const server = {
    server_url: parseArgs.SERVER_URL || config.server_url || 'http://localhost:3000',
    ip: ip.address(),
    port: parseArgs.PORT || config.port || 8090
};

let attributes = null;
if (parseArgs.TAG){
    attributes = (Array.isArray(parseArgs.TAG) ? parseArgs.TAG : [parseArgs.TAG]);
} else if (config.tags){
    attributes = config.tags;    
}

const agent_config = {
    agentName: parseArgs.NAME || config.name || os.hostname().replace(".", "") + '-' + process.platform.replace(".", ""),
    attributes: attributes
};

let env = Object.assign({}, paths, server, agent_config);

env.serverKey = ""  // TODO enter your server key 

module.exports = env;
