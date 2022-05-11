const executionsManager = require("../execution-manager");

const BaseController = require('../models/base-controller.model');

class ExecutionController extends BaseController{
    /**
     * Killing an action
     */
    async cancel(req, res){
        try {
            const killedAAction = executionsManager.killAction(req.body.mapId, req.body.actionId);

            if (killedAAction) {
                return res.status(204).send();
            }

            return res.status(404).send();
        } catch (error) {
            return res.status(500).send(error);
        }
    }
}

const executionController = new ExecutionController();
module.exports = executionController;
