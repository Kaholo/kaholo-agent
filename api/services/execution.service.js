const child_process = require('child_process');
const path = require('path');

const executionsManager = require("../../utils/execution-manager");
const pluginsService = require('../services/plugins.service');
const workersPath = path.join(__dirname, '../../workers');

class ExecutionService{

    constructor(){
    }

    sumResult(resultObj, err, data) {
        if (err) {
            resultObj.stderr += '\n' + err;
        } else if (resultObj.result) {
            resultObj.stdout += '\n' + resultObj.result;
        }

        try {
            resultObj.result += data.toString();
            resultObj.result = JSON.parse(resultObj.result);
        } catch (e) {}

        return resultObj;
    }
    
    async runTask(moduleType, methodName, paramsJson, mapId, versionId, executionId) {
        
        let result = {
            stdout: "",
            stderr: "",
            result: ""
        };
    
        if(paramsJson.settings && paramsJson.settings.length){
            let settings = {};
            for (let i=0, length=paramsJson.settings.length; i<length; i++){
                settings[paramsJson.settings[i].name] = paramsJson.settings[i].value;
            }
            paramsJson.settings = settings;
        }

        if (!pluginsService.plugins.hasOwnProperty(moduleType)){
            return { error: 'no such module', status :  'error'};
        }
    
        return new Promise((resolve)=>{
            let currentModule = pluginsService.plugins[moduleType];
            let workerProcess;
    
            if (currentModule.execProgram == 'node'){
                workerProcess = child_process.spawn(currentModule.execProgram, [path.join(workersPath,'node.js'), currentModule.main, JSON.stringify(paramsJson)]);
            } else {
                workerProcess = child_process.spawn(currentModule.execProgram, [currentModule.main, JSON.stringify(paramsJson)]);
            }
    
    
            executionsManager.addMapExecution(mapId, versionId, executionId, paramsJson._id, workerProcess);
            workerProcess.stdout.on('data', (data) => {
                result = this.sumResult(result, null, data);
            });
    
            workerProcess.stderr.on('data', (data) => {
                result = this.sumResult(result, data);
            });
    
            workerProcess.on('close', (code) => {
                result.status = code === 0 ? 'success' : 'error';
                return resolve(result);
            }); 
        });
    }
}

const executionService = new ExecutionService();

module.exports = executionService;