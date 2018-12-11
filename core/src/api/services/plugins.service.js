const exec = require('child_process').exec;
const fs = require("fs");
const path = require("path");
const del = require("del");
const rimraf = require("rimraf")
const unzip = require('unzipper');
const streams = require('memory-streams');

const environment = require('../../environment/environment');
const pluginsLoader = require('../../utils/pluginsLoader');

let modules_holder = {};


function installPlugin(filePath, obj) {
    //get a plugin path and the config file. This will unzip the plugin and install the modules.
    return new Promise(function (resolve, reject) {
        let dirName = path.join(environment.pluginsPath, obj.name);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }

        fs.createReadStream(filePath)
            .pipe(unzip.Extract({ path: dirName }))
            .on('finish', function (data) {
                console.log('end data');
                let cmd = 'cd ' + dirName + ' && ' + 'npm install ' + " && cd " + __dirname;
                exec(cmd, function (error, stdout, stderr) {
                    console.log(stdout);
                    console.log(stderr);
                    console.log(error);
                    if (error) {
                        reject(error);
                    }
                    pluginsLoader.loadPluginModule(dirName).then(function (err) {
                        if (err) {
                            return reject(err);
                        }
                    });
                    resolve();
                });
            });

    });
}

function deletePlugin(name){
    rimraf(`libs/plugins/${name}`,function(res,err){
        console.log(res)
    })
}

module.exports = {
    install: (filePath) => {
        return new Promise((resolve, reject) => {
            let extPath = path.join(environment.tmpPath, "" + new Date().getTime());
            fs.createReadStream(filePath)
                .pipe(unzip.Extract({ path: extPath }))
                .on('finish', function () {
                    let configPath = path.join(extPath, "config.json");
                    fs.exists(configPath, exists => {
                        if (!exists) return reject("No config file found!");

                        fs.readFile(configPath, "utf8", (err, body) => {
                            if (err) return reject("Error reading config file: ", err);

                            del([extPath]).then(() => {
                                console.log("info", "Deleted extracted directory");
                            }).catch(err => {
                                console.log("error", "Error deleting extracted directory");
                            });

                            let obj;
                            try {
                                obj = JSON.parse(body);
                            } catch (e) {
                                return reject("Error parsing config file: ", e);
                            }

                            installPlugin(filePath, obj).then(function () {
                                fs.unlinkSync(filePath); // deleting the uploaded file
                                return resolve();
                            }).catch(function (error) {
                                fs.unlinkSync(filePath); // deleting the uploaded file
                                throw new Error(error);
                            });
                        });
                    })
                });
        });
    },
    delete : (name)=> {
        return new Promise((resolve,reject) => {
            if (name){
                resolve(deletePlugin(name))
            }
            else reject()
        })
    }
};