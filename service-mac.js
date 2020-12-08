const serviceInstaller = require('./utils/service-installer');

var Service = require("node-mac").Service;

serviceInstaller(Service);
