const child_process = require('child_process');
const path = require('path');

const pluginsService = require('./services/plugins.service');
const workersPath = path.join(__dirname, '../workers');

const ERRORS = {
    "MODULE_NOT_FOUND": 100,
    "KILLED": null
}

class ExecutionManager{

    constructor(){
        this.executions = {};
    }

    async execute({executionId, settings, action}) {
        
        const pluginName = action.plugin.name;

        let result = {
            stdout: "",
            stderr: "",
            result: ""
        };
        
        let useSettings = {};
        if(settings && settings.length){
            for (let i=0, length=settings.length; i<length; i++){
                useSettings[settings[i].name] = settings[i].value;
            }
        }

        if (!pluginsService.plugins.hasOwnProperty(pluginName)){
            return { error: 'no such module', status :  'error'};
        }

        const executionData = {
            settings : useSettings,
            action
        }
    
        return new Promise((resolve)=>{
            const pluginConf = pluginsService.plugins[pluginName];
            let workerProcess;
    
            const spawnOptions = {
                windowsHide: true
            };

            workerProcess = child_process.spawn(
                pluginConf.execProgram, 
                [path.join(workersPath,'node.js'), pluginConf.main, JSON.stringify(executionData)],
                spawnOptions
            );
    
            this.addMapExecution(executionId, action._id, workerProcess);
            
            if (action.timeout || (!action.timeout && parseInt(action.timeout) !== 0)) {
                const timeout = parseInt(action.timeout || 600000);
                setTimeout(()=>{
                    result.stderr = "Timeout Error"
                    this.killAction(executionId,action._id);
                },timeout);
            }
            
            workerProcess.stdout.on('data', (data) => {
                result = this.sumResult(result, null, data);
            });
    
            workerProcess.stderr.on('data', (data) => {
                result = this.sumResult(result, data);
            });

            workerProcess.on('close', (code) => {
                switch (code) {
                    case ERRORS.MODULE_NOT_FOUND:
                        result.stderr = "ENOENT";
                    case ERRORS.KILLED:
                        result.stderr = result.stderr || "SIGKILL";
                }
                result.status = code === 0 ? 'success' : 'error';

                this.actionDone(executionId, action._id);
                return resolve(result);
            }); 
        });
    }

    addMapExecution(executionId, actionId, workerProcess){
        if (!this.executions[executionId]) {
            this.executions[executionId] = {};
        }
        this.executions[executionId][actionId] = workerProcess;
    }
    
    actionDone(executionId, actionId) {
        delete this.executions[executionId][actionId];
    }
    
    killAction(executionId, actionId) {
        if (!this.executions.hasOwnProperty(executionId) || !this.executions[executionId].hasOwnProperty(actionId)) {
            return ;
        }
        this.executions[executionId][actionId].kill('SIGTERM');
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
}

const executionManager = new ExecutionManager();

module.exports = executionManager;
