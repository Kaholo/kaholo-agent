const executionService = require("../services/execution.service");
const executionsManager = require("../../utils/execution-manager");

let tasks = {};

module.exports = {
    /**
     * registering and executing action.
     * @param req - contains action, mapId, versionId, executionId
     * @param res
     */
    add: (req, res) => {
        let action = req.body.action;
        let mapId = req.body.mapId;
        let versionId = req.body.versionId;
        let executionId = req.body.executionId;
        tasks[action._id] = 'executing';

        executionService.runTask(action.plugin.name, action.method.name, action, mapId, versionId, executionId).then(
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
            }
        );
    },

    /**
     * Killing an action
     * @param req - will contain mapId and actionId.
     * @param res
     * @returns {object}
     */
    cancel: (req, res) => {
        try {
            executionsManager.killAction(req.body.mapId, req.body.actionId);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).send(error);
        }
    },

    /**
     * return all tasks status
     * @param req
     * @param res
     * @returns {object}
     */
    status: (req, res) => {
        return res.json(tasks);
    }
};