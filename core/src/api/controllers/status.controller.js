const os = require("os");

const winston = require("winston");
const diskspace = require("diskspace");

const packgify = require("../../utils/packgify");
const pluginsLoader = require("../../utils/pluginsLoader");

function _status(){
    return new Promise((resolve, reject)=>{
        diskspace.check('C', function (err, total, free, status) {
            free = free || total.free;
            return resolve({ hostname: os.hostname(), arch: process.platform, freeSpace: free, installed_plugins: packgify.packagify(pluginsLoader.module_holder) })
        });
        
    })

}

module.exports = {
    /*return status agent status with basic information*/
    status: async(req, res) => {
        // winston.info("Check agent status");
        res.status(200);
        let status = await _status()
        return res.json(status); //TODO changed installed plugins
       
    },

    getStatus: _status
};