var express = require('express');
var diskspace = require('diskspace');
var os = require('os');
var router = express.Router();
var moduleLoader = require('../utils/jsloader.js');
var request = require('request');
var multer = require('multer');
var fs = require('fs');
var unzip = require('unzip');
var exec = require('child_process').exec;
var pmRegister = require('../utils/register');
const streams = require('memory-streams');
var baseAgentKey = "";
var path = require('path');
var KEYDIR = path.join(__dirname, "../keys/key.pm");
var executionsManager = require('../utils/execution-manager');


fs.readFile(KEYDIR, 'utf8', function (err, data) {
    if (err) {
        pmRegister.registerAgent(function (key) {
            baseAgentKey = key;
        });
    }
    else {
        baseAgentKey = data;
        pmRegister.updateAgent(baseAgentKey);
    }
});

router.post('/task/unregister', function (req, res, next) {
    var execution_result = { msg: "unregistered task!" };
    var action = req.body.action;
    var key = req.body.key;
    console.log("unregistering task");
    console.log(action);
    if (!key) {
        console.log("No key provided");
        res.status(500);
        return res.send(JSON.stringify({ error: "No key provided to baseAgent" }));
    }
    if (key != baseAgentKey) {
        console.log("Wrong Key provided - no permissions");
        console.log(key);
        console.log(baseAgentKey);
        res.status(500);
        return res.send(JSON.stringify({ error: "Wrong Key provided to baseAgent - no permissions to execute actions" }));
    }
    try {
        executionsManager.killAction(req.body.mapId, req.body.action.name);
        return res.send(execution_result);
    } catch (error) {
        return res.send(JSON.stringify({ error: error }));
    }
});

router.post('/deleteworkspace', function (req, res, next) {
    var key = req.body.key;
    var mapId = req.body.mapId;
    var versionId = req.body.versionId;
    var executionId = req.body.executionId;

    if (!key) {
        console.log("No key provided");
        res.status(500);
        return res.send(JSON.stringify({ error: "No key provided to baseAgent" }));
    }
    if (key != baseAgentKey) {
        console.log("Wrong Key provided - no permissions");
        console.log(key);
        console.log(baseAgentKey);
        res.status(500);
        return res.send(JSON.stringify({ error: "Wrong Key provided to baseAgent - no permissions to execute actions" }));
    }
    try {
        executionsManager.deleteExecutionData(mapId, versionId, executionId);
        return res.send("success");
    } catch (error) {
        return res.send(JSON.stringify({ error: error }));
    }
});

/* GET home page. */
router.post('/task/register', function (req, res, next) {
    var execution_result = { msg: "registered task!" };
    var action = req.body.action;
    var mapId = req.body.mapId;
    var versionId = req.body.versionId;
    var executionId = req.body.executionId;
    var key = req.body.key;
    if (!key) {
        console.log("No key provided");
        res.status(500);
        return res.send(JSON.stringify({ error: "No key provided to baseAgent" }));
    }
    if (key != baseAgentKey) {
        console.log("Wrong Key provided - no permissions");
        console.log(key);
        console.log(baseAgentKey);
        res.status(500);
        return res.send(JSON.stringify({ error: "Wrong Key provided to baseAgent - no permissions to execute actions" }));
    }

    if (!action.server || !action.server.url) {
        console.log("Running local agent");
        moduleLoader.runModuleFunction(action.plugin.name, action.method.name, action, mapId, versionId, executionId, action.name).then(
            function (result) {
                executionsManager.actionDone(mapId, action.name);
                if (result.status === 'error') {
                    res.status(500);
                    return res.send(JSON.stringify(result));
                }
                else {
                    res.status(200);
                    return res.send(JSON.stringify(result));
                }
            });
    }
    else {
        var DEDICATED_AGENT_URL = action.server.url;

        request.post(
            DEDICATED_AGENT_URL,
            { form: action },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    body = JSON.parse(body);
                    if (body.hasOwnProperty("error")) {
                        res.status(500);
                        console.log("Return with status 500");
                    }
                    console.log(body);
                    return res.send(JSON.stringify(body));
                }
                else {
                    console.log(error);
                    res.status(500);
                    return res.send(JSON.stringify({ error: error }));
                }
            }
        );
    }
});

router.use(multer({ dest: './uploads/' }).single('file'));

function installPlugin(filePath, obj) {
    //get a plugin path and the config file. This will unzip the plugin and install the modules.
    return new Promise(function (resolve, reject) {
        var dirName = path.join(path.dirname(__dirname), "libs", obj.name);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }

        fs.createReadStream(filePath)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                var fileName = entry.path;
                entry.pipe(fs.createWriteStream(path.join(dirName, fileName)));
            }).on('close', function (data) {
            console.log('end data');
            var cmd = 'cd ' + dirName + '&&' + ' npm install ' + " && cd " + __dirname;
            exec(cmd, function (error, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                console.log(error);
                if (error) {
                    reject(error);
                }
                moduleLoader.loadModules(dirName).then(function (err) {
                    console.log(err);
                }); // Load initial modules
                setTimeout(function () {
                    resolve();
                }, 2000);
            });
        });

    });
}

/** API path that will upload the files */
router.post('/registeragent', function (req, res) {
    //get plugin config file
    fs.createReadStream(req.file.path)
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
            var fileName = entry.path;
            if (fileName === 'config.json') {
                var writer = new streams.WritableStream();
                entry.pipe(writer);

                var body = '';

                entry.on('data', function (chunk) {
                    body += chunk;
                });

                entry.on('end', function () {
                    //get the config file and pass it to the installer
                    var obj = JSON.parse(body);
                    installPlugin(req.file.path, obj).then(function () {
                        console.log("Good");
                        res.status(200);
                        return res.send(JSON.stringify({ res: "Installed successfully" }));
                    }).catch(function (error) {
                        console.log(error);
                        res.status(500);
                        return res.send(JSON.stringify({ error: error }));
                    });
                })
            } else {
                entry.autodrain();
            }
        })
});


router.post('/isalive', function (req, res, next) {
    var key = req.body.key;
    if (!key) {
        console.log("No key provided");
        res.status(500);
        return res.send(JSON.stringify({ error: "No key provided to baseAgent" }));
    }
    if (key != baseAgentKey) {
        console.log("Wrong Key provided - no permissions");
        res.status(500);
        return res.send(JSON.stringify({ error: "Wrong Key provided to baseAgent - no permissions to install library" }));
    }

    diskspace.check('C', function (err, total, free, status) {
        res.status(200);
        return res.send(JSON.stringify({
            res: "Success",
            info: { hostname: os.hostname(), arch: process.platform, freeSpace: free }
        }));
    });
});

module.exports = router;