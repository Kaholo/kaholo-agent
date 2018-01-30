const os = require("os");

const winston = require("winston");
const diskspace = require("diskspace");

module.exports = {
    /*return status agent status with basic information*/
    status: (req, res) => {
        winston.info("Check agent status");
        diskspace.check('C', function (err, total, free, status) {
            free = free || total.free;
            res.status(200);
            return res.json({ hostname: os.hostname(), arch: process.platform, freeSpace: free, installed_plugins: {} }); //TODO changed installed plugins
        });
    }
};