const ioClient = require("socket.io-client");
const winston = require("winston");

const executionsManager = require("../execution-manager");

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
    
    const [executionId, iterationIndex, actionId] = action.uniqueRunId.split('|');
    action._id = actionId;
    const executionData = {executionId, action, settings};
    
    const result = await executionsManager.execute(executionData);
    winston.log("info", "emitting result to server");
    this.socket.emit(action.uniqueRunId, result);
  }
}

const socketService = new SocketService();

module.exports = socketService;
