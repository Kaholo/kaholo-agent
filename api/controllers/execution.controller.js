const executionService = require("../services/execution.service");
const executionsManager = require("../../utils/execution-manager");

const BaseController = require('../models/base-controller.model');

class ExecutionController extends BaseController{
    
    /**
     * registering and executing action.
     */
    async add(req, res){
        let action = req.body.action;
        let settings = req.body.settings;
        let mapId = req.body.mapId;
        let versionId = req.body.versionId;
        let executionId = req.body.executionId;
      
        const result = await executionService.runTask(action.plugin.name, action.method.name,{action, settings}, mapId, versionId, executionId);
        executionsManager.actionDone(mapId, action.name);
        if (result.status === 'error') {
            res.status(500);
        } else {
            res.status(200);
        }
        return res.send(JSON.stringify(result));
    }

    /**
     * Killing an action
     */
    async cancel(req, res){
        try {
            executionsManager.killAction(req.body.mapId, req.body.actionId);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).send(error);
        }
    }
}

const executionController = new ExecutionController();
module.exports = executionController;