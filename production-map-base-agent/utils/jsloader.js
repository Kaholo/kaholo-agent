var fs = require('fs');
var path_module = require('path');
var q = require('q');
var module_holder = {};
var child_process = require('child_process');
var _ = require('lodash');
var executionsManager = require('../utils/execution-manager');

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function LoadModules(path, parentDir) {
    var deferred = q.defer();
    fs.lstat(path, function(err, stat) {
        if(err){
            console.log('lstat error');
            console.log(err);
            return deferred.reject(err);
        }
        if (stat.isDirectory()) {
            // we have a directory: do a tree walk
            fs.readdir(path, function(err, files) {
                var f, l = files.length;
                for (var i = 0; i < l; i++) {
                    f = path_module.join(path, files[i]);
                    LoadModules(f, path);
                }
            });
        } else {
            // we have a file: load it
            if(!endsWith(path, path_module.join('/', 'config.json'))) {
                return deferred.reject("not config.json file");
            }
            try {
                var module = require(path);
                if(!module.type){
                    console.log("no type exported in module");
                    return deferred.reject("no type exported in module");
                }
                if(!module_holder.hasOwnProperty(module.type)) {
                    module.main = path_module.join(parentDir, module.main);
                    module_holder[module.type] = module;
                }
            }catch(e) {
                // statements
                console.log("try catch error");
                console.log(e);
                return deferred.reject(e);
            }
            return deferred.resolve("success");
        }
    });
    return deferred.promise;
}

function runModuleFunction(moduleType, methodName, paramsJson, mapId, versionId, executionId, actionId) {
    var deffered = q.defer();
    if(module_holder.hasOwnProperty(moduleType)) {
        var currentModule = module_holder[moduleType];
        var workerProcess = child_process.spawn(currentModule.execProggram, [currentModule.main, JSON.stringify(paramsJson)]);
        var workerResult = "";

        executionsManager.addMapExecution(mapId, versionId, executionId, actionId, workerProcess);
        workerProcess.stdout.on('data', function (data) {
            workerResult += data;
        });

        workerProcess.stderr.on('data', function (data) {
                workerResult += data;
        });

        workerProcess.on('close', function (code) {
            if (code <= 0) {
                return deffered.resolve({"error": workerResult});
            } else {
                return deffered.resolve({"res": workerResult});
            }
        });
    }
    else{
        console.log('nos such module');
        deffered.resolve({error: 'no such module'});
    }
    return deffered.promise;
}

var DIR = path_module.join(__dirname, '../', 'libs');
console.log('Loading modules...');
LoadModules(DIR, null); // Load initial modules
setTimeout(function () {
  console.log('Loaded modules');
  console.log(JSON.stringify(module_holder));
}, 2000);

exports.loadModules = LoadModules;
exports.runModuleFunction = runModuleFunction;