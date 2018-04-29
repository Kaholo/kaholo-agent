const path = require("path");

const os = require("os");
const ip = require('ip');
const parseArgs = require('minimist')(process.argv.slice(2));

const config = require("../../../config/config");

const paths = {
    keyPath: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'config', 'key.pm'),
    pluginsPath: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'libs', 'plugins')
};

const server = {
    server_url: parseArgs.SERVER_URL || 'http://localhost:3000',
    ip: ip.address(),
    port: parseArgs.PORT || 8090
};

const agent_config = {
    agentName: parseArgs.NAME || os.hostname().replace(".", "") + '-' + process.platform.replace(".", ""),
    attributes: parseArgs.TAG ? (Array.isArray(parseArgs.TAG) ? parseArgs.TAG : [parseArgs.TAG]) : null
};

let env = Object.assign({}, paths, server, agent_config, config);
module.exports = env;
