const os = require("os");
const diskspace = require("diskspace");

const BaseController = require("../models/base-controller.model");
const pluginsService = require("../services/plugins.service");

class StatusController extends BaseController{
    
    async diskCheck(){
        return new Promise((resolve,reject)=>{
            diskspace.check('C', function (err, total, free, status) {
                if (err) return reject (err)
                resolve({total, free, status});
            })
        })
    }
    
    /**
    * return status agent status with basic information
    */
    async status(req, res){
        
        //TODO: get a way to get device free space
        res.status(200);
        return res.json({ 
            hostname: os.hostname(), 
            arch: process.platform, 
            freeSpace: 0, 
            installed_plugins: 
            pluginsService.getVersions()
        });
    }
}

const statusController = new StatusController();

module.exports = statusController;
