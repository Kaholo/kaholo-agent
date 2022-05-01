const child_process = require("child_process");
const path = require("path");
const process = require("process");
const fs = require("fs");

const pluginsService = require("./services/plugins.service");
const workersPath = path.join(__dirname, "../workers");

const ERRORS = {
  MODULE_NOT_FOUND: 100,
  KILLED: null,
};

class ExecutionManager {
  constructor() {
    this.executions = {};
  }

  async execute({ executionId, settings, action }) {
    const pluginName = action.plugin.name;

    let result = {
      stdout: "",
      stderr: [],
      result: [],
    };
    let stopReason = "";

    let useSettings = {};
    if (settings && settings.length) {
      for (let i = 0, length = settings.length; i < length; i++) {
        useSettings[settings[i].name] = settings[i].value;
      }
    }

    if (!pluginsService.plugins.hasOwnProperty(pluginName)) {
      return { error: "no such module", status: "error" };
    }

    const executionData = {
      settings: useSettings,
      action,
    };

    return new Promise((resolve) => {
      const pluginConf = pluginsService.plugins[pluginName];
      let workerProcess;

      const spawnOptions = {
        windowsHide: true,
        cwd: path.join(process.cwd(), "./workspace"),
      };

      if (!fs.existsSync(spawnOptions.cwd)) {
        fs.mkdirSync(spawnOptions.cwd, { recursive: true });
      }

      workerProcess = child_process.spawn(
        pluginConf.execProgram,
        [
          path.join(workersPath, "node.js"),
          pluginConf.main,
          JSON.stringify(executionData),
        ],
        spawnOptions
      );

      this.addMapExecution(executionId, action._id, workerProcess);
      const DEFAULT_TIMEOUT_VALUE = 600000;
      let timeout = Number(action.timeout) || DEFAULT_TIMEOUT_VALUE;
      timeout = timeout <= 0 ? DEFAULT_TIMEOUT_VALUE : timeout;
      setTimeout(() => {
        stopReason = "Timeout Error";
        this.killAction(executionId, action._id);
      }, timeout);

      workerProcess.stdout.on("data", (data) => {
        result.result.push(data);
      });

      workerProcess.stderr.on("data", (data) => {
        result.stderr.push(data);
      });

      workerProcess.on("close", (code) => {
        switch (code) {
          case ERRORS.MODULE_NOT_FOUND:
            stopReason = "ENOENT";
            break;
          case ERRORS.KILLED:
            stopReason = stopReason || "SIGKILL";
            break;
        }
        result.status = code === 0 ? "success" : "error";

        this.actionDone(executionId, action._id);
        result.result = Buffer.concat(result.result).toString("utf8").trim();
        try {
          result.result = JSON.parse(result.result);
        } catch (e) {}
        result.stderr =
          stopReason || Buffer.concat(result.stderr).toString("utf8").trim();
        return resolve(result);
      });
    });
  }

  addMapExecution(executionId, actionId, workerProcess) {
    if (!this.executions[executionId]) {
      this.executions[executionId] = {};
    }
    this.executions[executionId][actionId] = workerProcess;
  }

  actionDone(executionId, actionId) {
    delete this.executions[executionId][actionId];
  }

  killAction(executionId, actionId) {
    if (
      !this.executions.hasOwnProperty(executionId) ||
      !this.executions[executionId].hasOwnProperty(actionId)
    ) {
      return false;
    }

    this.executions[executionId][actionId].kill("SIGTERM");

    return true;
  }
}

const executionManager = new ExecutionManager();

module.exports = executionManager;
