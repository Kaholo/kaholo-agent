var fs = require('fs');
var path_module = require('path');
var q = require('q');
var module_holder = {};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function LoadModules(path) {
    fs.lstat(path, function(err, stat) {
        if (stat.isDirectory()) {
            // we have a directory: do a tree walk
            fs.readdir(path, function(err, files) {
                var f, l = files.length;
                for (var i = 0; i < l; i++) {
                    f = path_module.join(path, files[i]);
                    LoadModules(f);
                }
            });
        } else {
            // we have a file: load it
            console.log("loading file");
            if(!endsWith(path, '.js')) {
                return;
            }
            try {
                var module = require(path);
                console.log(path);
                if(!module.name){
                    console.log("no name exported in module");
                    return;
                }
                if(!module_holder.hasOwnProperty(module.name)) {
                    module_holder[module.name] = module;
                }
            }catch(e) {
                // statements
                console.log(e);
            }
        }
    });
}

function runModuleFunction(moduleName, actionName, paramsJson) {
    var deffered = q.defer();
    if(module_holder.hasOwnProperty(moduleName)) {
        var module = module_holder[moduleName];
        if(module.hasOwnProperty(actionName)) {
            return module_holder[moduleName][actionName](paramsJson);
        }
        console.log('nos such action');
        deffered.resolve({error: 'no such action'});
    }
    else{
        console.log('nos such module');
        deffered.resolve({error: 'no such module'});
    }
    return deffered.promise;
}

var DIR = path_module.join(__dirname, '../', 'libs');
console.log('Loading modules...');
LoadModules(DIR); // Load initial modules
setTimeout(function () {
  console.log('Loaded modules');
  console.log(JSON.stringify(module_holder));
}, 2000);

exports.loadModules = LoadModules;
exports.runModuleFunction = runModuleFunction;