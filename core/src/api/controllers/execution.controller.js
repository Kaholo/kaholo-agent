const executionService = require("../services/execution.service");
const executionsManager = require("../../utils/execution-manager");

let tasks = {};

module.exports = {
    /* add a new task to the agent */
    add: (req, res) => {
        let action = req.body.action;
        let mapId = req.body.mapId;
        let versionId = req.body.versionId;
        let executionId = req.body.executionId;
        tasks[action._id] = 'executing';

        executionService.runTask(action.plugin.name, action.method.name, action, mapId, versionId, executionId, action.name).then(
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
    /* cancel a task that was registered */
    cancel: (req, res) => {
        try {
            executionsManager.killAction(req.body.mapId, req.body.action.name);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).send(error);
        }
    },
    /* get status of running tasks */
    status: (req, res) => {
        return res.json(tasks);
    }
};