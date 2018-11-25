const child_process = require('child_process');
const path = require('path');
const q = require('q');

const executionsManager = require("../../utils/execution-manager");
const pluginsLoader = require('../../utils/pluginsLoader');
const workersPath = path.join(__dirname, '../../workers');

function runModuleFunction(moduleType, methodName, paramsJson, mapId, versionId, executionId) {
    let stdout = "";
    let stderr = "";
    let result = "";

    function sumResult(err, data) {
        if (err) {
            stderr += '\n' + err;
        } else if (result) {
            stdout += '\n' + result;
        }
        try {
            result = JSON.parse(data.toString());
        } catch (e) {
            result = data;
        }
    }

    let deffered = q.defer();
    if (pluginsLoader.module_holder.hasOwnProperty(moduleType)) {
        let currentModule = pluginsLoader.module_holder[moduleType];
        let workerProcess;

        if (currentModule.execProgram == 'node'){
            workerProcess = child_process.spawn(currentModule.execProgram, [path.join(workersPath,'node.js'), currentModule.main, JSON.stringify(paramsJson)]);
        } else {
            workerProcess = child_process.spawn(currentModule.execProgram, [currentModule.main, JSON.stringify(paramsJson)]);
        }


        executionsManager.addMapExecution(mapId, versionId, executionId, paramsJson._id, workerProcess);
        workerProcess.stdout.on('data', function (data) {
            sumResult(null, data);
        });

        workerProcess.stderr.on('data', function (data) {
            sumResult(data);
        });

        workerProcess.on('close', function (code) {
            let res = {
                stdout: stdout,
                stderr: stderr,
                result: result
            };
            res.status = code === 0 ? 'success' : 'error';
            return deffered.resolve(res);
        });
    }
    else {
        console.log('no such module');
        deffered.resolve({ error: 'no such module' });
    }
    return deffered.promise;
}


module.exports = {
runTask: runModuleFunction
};