const ioClient = require("socket.io-client");
const winston = require("winston");

const executionService = require("./execution.service");
const executionsManager = require("../../utils/execution-manager");

class SocketService {
  constructor() {
    this.socket = undefined;
  }

  /**
   * Subscribe to agents namespace at server
   */
  subscribeToSocket() {
    winston.log("info", "Subscribing to socket");

    // subscribe to namespace, pass agents' key
    this.socket = ioClient(`${process.env.SERVER_URL}/agents`, {
      query: `key=${process.env.AGENT_KEY}`,
    });

    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("disconnect", this.onDisconnect.bind(this));
    this.socket.on("add-task", this.onAddTask.bind(this));
  }

  onConnect(data) {
    winston.log("info", "Socket is connected");
  }

  onDisconnect() {
    winston.log("info", "Socket disconnected, trying to reconnect");
    this.socket.open();
  }

  async onAddTask(data) {
    winston.log("info", "got new task");
    let action = data.action;
    let settings = data.settings;
    let mapId = data.mapId.toString();
    let versionId = data.versionId.toString();
    let executionId = data.executionId.toString();

    const result = await executionService.runTask(
      action.plugin.name,
      action.method.name,
      { action, settings },
      mapId,
      versionId,
      executionId
    );
    executionsManager.actionDone(mapId, action.name);
    winston.log("info", "emitting result to server");
    this.socket.emit(action.uniqueRunId, result);
  }
}

const socketService = new SocketService();

module.exports = socketService;
