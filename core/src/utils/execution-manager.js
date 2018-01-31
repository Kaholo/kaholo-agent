require('shelljs/global');
var path = require('path');
var executions = {};

function gotoExecutionId(mapId, versionId, executionId) {
    var dirPath = path.join('workspace', mapId, versionId, executionId);
    var res = cd(dirPath);
    if (res.code !== 0) {
        mkdir('-p', dirPath);
        cd(dirPath);
    }
}

function deleteExecutionData(mapId, versionId, executionId) {
    var dirPath = path.join('workspace', mapId, versionId, executionId);
    rm('-rf', dirPath);
}

function addMapExecution(mapId, versionId, executionId, actionId, workerProcess){
    if (!executions[mapId]) {
        executions[mapId] = {};
    }
    executions[mapId][actionId] = workerProcess;
    gotoExecutionId(mapId, versionId, executionId);
}

function hasRunningExecution(mapId) {
    return executions.hasOwnProperty(mapId);
}

function actionDone(mapId, actionId) {
    var dirPath = path.join('..', '..', '..', '..');
    cd(dirPath);
    delete executions[mapId][actionId];

}

function killAction(mapId, actionName) {
    executions[mapId][actionName].kill('SIGTERM');
}

exports.addMapExecution = addMapExecution;
exports.hasRunningExecution = hasRunningExecution;
exports.actionDone = actionDone;
exports.deleteExecutionData = deleteExecutionData;
exports.killAction = killAction;