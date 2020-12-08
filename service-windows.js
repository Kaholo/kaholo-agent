const serviceInstaller = require('./utils/service-installer');

var Service = require("node-windows").Service;

serviceInstaller(Service);
