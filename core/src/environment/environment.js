const path = require("path");
const config = require("../../../config/config");
const parseArgs = require('minimist')(process.argv.slice(2));

const paths = {
    keyPath: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'config', 'key.pm'),
    pluginsPath: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'libs', 'plugins')
};

const server = {
  server_url: parseArgs.SERVER_URL || 'localhost:3000'
};

let env = Object.assign({}, paths, config);

module.exports = env;
