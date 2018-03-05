const ioClient = require("socket.io-client");
const winston = require("winston");

const env = require("../../environment/environment");
const executionService = require("../services/execution.service");
const executionsManager = require("../../utils/execution-manager");


let socket;
let tasks = {};


function listeners() {

    socket.on('connect', (data) => {
        winston.log("info", "Socket is connected");

    });

    socket.on('add-task', (data) => {
        winston.log("info", "got new task");
        let action = data.action;
        let mapId = data.mapId.toString();
        let versionId = data.versionId.toString();
        let executionId = data.executionId.toString();
        tasks[action._id] = 'executing';

        executionService.runTask(action.plugin.name, action.method.name, action, mapId, versionId, executionId)
            .then((result) => {
                    executionsManager.actionDone(mapId, action.name);
                    winston.log("info", "emitting result to server");
                    socket.emit(action.uniqueRunId, result);
                    socket.emit(action.uniqueRunId, result);
                }
            );
    });

}

module.exports = {
    /**
     * Subscribe to agents namespace at server
     */
    subscribeToSocket: () => {
        winston.log("info", "Subscribing to socket");

        socket = ioClient(env.server_url + '/agents', { query: `key=${env.key}` }); // subscribe to namespace, pass agents' key
        listeners();
    }
};