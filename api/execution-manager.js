const child_process = require("child_process");
const path = require("path");
const process = require("process");
const fs = require("fs");
const net = require("net");
const getPort = require("get-port");

const pluginsService = require("./services/plugins.service");
const workersPath = path.join(__dirname, "../workers");

const ERRORS = {
  MODULE_NOT_FOUND: 100,
  KILLED: null,
};

const DEFAULT_TIMEOUT_VALUE = 600000;

class ExecutionManager {
  constructor() {
    this.executions = {};
  }

  async execute({ runId, settings, action }) {
    const pluginName = action.plugin.name;

    let result = {
      stdout: [],
      stderr: [],
      result: [],
    };
    let errorCode = "";

    if (!pluginsService.plugins.hasOwnProperty(pluginName)) {
      return { error: "no such module", status: "error" };
    }

    const executionData = {
      settings,
      action,
    };

    const port = await getPort();
    const server = net.createServer();
    server.listen(port, "127.0.0.1");

    return new Promise((resolve) => {
      const pluginConf = pluginsService.plugins[pluginName];
      let workerProcess;

      const spawnOptions = {
        windowsHide: true,
        cwd: path.join(process.cwd(), "./workspace"),
        env: {
          ...process.env, // Don't know if anything is used, but for compatibility let's keep old envs
          RESULT_PORT: port,
        }
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

      this.addMapExecution(runId, workerProcess);

      let timeout = Number(action.timeout) || DEFAULT_TIMEOUT_VALUE;
      timeout = timeout <= 0 ? DEFAULT_TIMEOUT_VALUE : timeout;
      setTimeout(() => {
        errorCode = "ETIMEOUT";
        this.killAction(runId);
      }, timeout);

      server.on("connection", (sock) => {
        console.info("Worker connected to tcp server");

        sock.on("data", data => {
          if (result.result.push) {
            result.result.push(data);
          } else {
            console.error('Unexpected data from spawned worker after exit event:', data.toString());
          }
        });
      });

      workerProcess.stdout.on("data", (data) => {
        if (result.stdout.push) {
          result.stdout.push(data);
        } else {
          console.error('Unexpected stdout from spawned worker after exit event:', data.toString());
        }
      });

      workerProcess.stderr.on("data", (data) => {
        if (result.stderr.push) {
          result.stderr.push(data);
        } else {
          console.error('Unexpected stderr from spawned worker after exit event:', data.toString());
        }
      });

      workerProcess.on("exit", (code) => {
        switch (code) {
          case ERRORS.MODULE_NOT_FOUND:
            errorCode = "ENOENT";
            break;
          case ERRORS.KILLED:
            errorCode = errorCode || "SIGKILL";
            break;
        }
        result.status =
          code === 0
            ? "success"
            : errorCode === "SIGKILL"
            ? "stopped"
            : "error";

        this.actionDone(runId);
        result.result = Buffer.concat(result.result).toString("utf8").trim();
        try {
          result.result = JSON.parse(result.result);
        } catch (e) {}

        result.stdout = Buffer.concat(result.stdout).toString("utf8").trim();
        result.stderr = Buffer.concat(result.stderr).toString("utf8").trim();
        result.errorCode = errorCode;
        server.close();

        return resolve(result);
      });
    });
  }

  addMapExecution(runId, workerProcess) {
    this.executions[runId] = workerProcess;
  }

  actionDone(runId) {
    delete this.executions[runId];
  }

  killAction(runId) {
    if (
      !this.executions.hasOwnProperty(runId)
    ) {
      return false;
    }

    this.executions[runId].kill("SIGTERM");

    return true;
  }
}

const executionManager = new ExecutionManager();

module.exports = executionManager;
