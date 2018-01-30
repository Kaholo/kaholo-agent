const path = require("path");
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

let env = Object.assign({}, paths, server, config);
module.exports = env;
