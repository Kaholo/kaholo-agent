const fs = require("fs");
const path = require("path");
const q = require('q');

let module_holder = {};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function loadPluginModule(pluginPath, parentDir) {
    let deferred = q.defer();
    fs.lstat(pluginPath, function (err, stat) {
        if (err) {
            console.log('lstat error', err);
            return deferred.reject(err);
        }
        if (stat.isDirectory()) {
            // we have a directory: do a tree walk
            fs.readdir(pluginPath, function (err, files) {
                let f, l = files.length;
                for (let i = 0; i < l; i++) {
                    f = path.join(pluginPath, files[i]);
                    loadPluginModule(f, pluginPath);
                }
            });
        } else {
            // we have a file: load it
            if (!endsWith(pluginPath, path.join('config.json'))) {
                return deferred.reject("not config.json file");
            }
            try {
                let module = require(pluginPath);
                if (!module.name) {
                    console.log("no name exported in module");
                    return deferred.reject("no type exported in module");
                }
                if (!module_holder.hasOwnProperty(module.name)) {
                    module.main = path.join(parentDir, module.main);
                    module_holder[module.name] = module;
                }
            } catch (e) {
                // statements
                console.log("Error loading module: ", e);
                return deferred.reject(e);
            }
            return deferred.resolve("success");
        }
    });
    return deferred.promise;
}


module.exports = {
    loadPluginModule: loadPluginModule
};