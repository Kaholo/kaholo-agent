const exec = require('child_process').exec;
const fs = require("fs");
const path = require("path");

const unzip = require('unzip');
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
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                let fileName = entry.path;
                entry.pipe(fs.createWriteStream(path.join(dirName, fileName)));
            }).on('close', function (data) {
            console.log('end data');
            let cmd = 'cd ' + dirName + '&&' + ' npm install ' + " && cd " + __dirname;
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

module.exports = {
    install: (filePath) => {
        return new Promise ((resolve, reject) => {

        fs.createReadStream(filePath)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                let fileName = entry.path;
                if (fileName === 'config.json') {
                    let writer = new streams.WritableStream();
                    entry.pipe(writer);
                    let body = '';
                    entry.on('data', function (chunk) {
                        body += chunk;
                    });

                    entry.on('end', function () {
                        //get the config file and pass it to the installer
                        let obj = JSON.parse(body);
                        installPlugin(filePath, obj).then(function () {
                            fs.unlinkSync(filePath); // deleting the uploaded file
                            return resolve();
                        }).catch(function (error) {
                            fs.unlinkSync(filePath); // deleting the uploaded file
                            throw new Error(error);
                        });
                    })
                } else {
                    entry.autodrain();
                }
            });
        });

    },
    modules: modules_holder
};