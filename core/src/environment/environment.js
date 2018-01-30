const path = require("path");
const config = require("../../../config/config");

const keyPath = {keyPath: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'config', 'key.pm')};
let env = Object.assign({}, keyPath, config);

module.exports = env;
