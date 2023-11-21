const child_process = require("child_process");
const path = require("path");
const process = require("process");
const fs = require("fs");
const net = require("net");
const getPort = require("get-port");
const { eventsWorker, VHOST } = require("@kaholo/shared");

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

  async execute({ runId, settings, action, pipelineExecutionId }) {
    const actionExecutionId = action.actionExecutionId;

    let result = {
      stdout: [],
      stderr: [],
      result: [],
    };
    let errorCode = "";

    const executionData = {
      settings,
      action,
    };

    const port = await getPort();
    const server = net.createServer();
    server.listen(port, "127.0.0.1");

    return new Promise((resolve) => {
      let pluginConf;
      if (action.plugin) {
        pluginConf = pluginsService.plugins[action.plugin.name][action.plugin.version];
      } else {
        pluginConf = {
          execProgram: "node",
          main: action.internal.path,
        };
      }

      let workerProcess;

      const spawnOptions = {
        windowsHide: true,
        cwd: process.cwd(),
        env: {
          // To support external agents custom env variables, and also SERVER_URL usage
          ...process.env,
          RESULT_PORT: port,
          PRIVATE_IP: undefined,
          AGENT_KEY: undefined,
          AMQP_URI_RESULTS: undefined,
          AMQP_URI_ACTIONS: undefined,
          AMQP_RESULT_QUEUE: undefined,
          PLUGINS_DIR_PATH: undefined,
        },
      };

      if (!fs.existsSync(spawnOptions.cwd)) {
        fs.mkdirSync(spawnOptions.cwd, { recursive: true });
      }

      try {
        workerProcess = child_process.spawn(
          pluginConf.execProgram,
          [
            path.join(workersPath, "node.js"),
            pluginConf.main,
            JSON.stringify(executionData),
          ],
          spawnOptions
        );
      } catch (error) {
        console.error("child process spawn error: ", error);
        result.status = "error";
        result.result = error;
        result.stdout = "";
        result.stderr = "";
        result.errorCode = error.code;
        server.close();
        return resolve(result);
      }

      this.addMapExecution(runId, workerProcess);

      let timeout = Number(action.timeout) || DEFAULT_TIMEOUT_VALUE;
      timeout = timeout <= 0 ? DEFAULT_TIMEOUT_VALUE : timeout;
      setTimeout(() => {
        errorCode = "ETIMEOUT";
        this.killAction(runId);
      }, timeout);

      server.on("connection", (sock) => {
        console.info("Worker connected to tcp server");

        sock.on("data", async (data) => {
          if (result.result.push) {
            result.result.push(data);

            await eventsWorker.publish({
              queue: "FlowControl/Twiddlebug/Result",
              vhost: VHOST.RESULTS,
              event: {
                inputData: {
                  type: "result",
                  actionId: action.id,
                  id: `result-${actionExecutionId}`,
                  base64data: data.toString("base64"),
                  pipelineExecutionId,
                  executionLogsQueueId: `logs-${pipelineExecutionId}`,
                },
              },
            });
          } else {
            console.error(
              "Unexpected data from spawned worker after exit event:",
              data.toString()
            );
          }
        });
      });

      workerProcess.stdout.on("data", async (data) => {
        if (result.stdout.push) {
          result.stdout.push(data);

          await eventsWorker.publish({
            queue: "FlowControl/Twiddlebug/Result",
            vhost: VHOST.RESULTS,
            event: {
              inputData: {
                type: "stdout",
                actionId: action.id,
                id: `stdout-${actionExecutionId}`,
                base64data: data.toString("base64"),
                pipelineExecutionId,
                executionLogsQueueId: `logs-${pipelineExecutionId}`,
              },
            },
          });
        } else {
          console.error(
            "Unexpected stdout from spawned worker after exit event:",
            data.toString()
          );
        }
      });

      workerProcess.stderr.on("data", async (data) => {
        if (result.stderr.push) {
          result.stderr.push(data);

          await eventsWorker.publish({
            queue: "FlowControl/Twiddlebug/Result",
            vhost: VHOST.RESULTS,
            event: {
              inputData: {
                type: "stderr",
                actionId: action.id,
                id: `stderr-${actionExecutionId}`,
                base64data: data.toString("base64"),
                pipelineExecutionId,
                executionLogsQueueId: `logs-${pipelineExecutionId}`,
              },
            },
          });
        } else {
          console.error(
            "Unexpected stderr from spawned worker after exit event:",
            data.toString()
          );
        }
      });

      workerProcess.on("error", (error) => {
        console.error("child process error: ", error);
        result.status = "error";
        result.result = error;
        result.stdout = "";
        result.stderr = "";
        result.errorCode = error.code;
        server.close();
        return resolve(result);
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
    if (!this.executions.hasOwnProperty(runId)) {
      return false;
    }

    this.executions[runId].kill("SIGTERM");

    return true;
  }
}

const executionManager = new ExecutionManager();

module.exports = executionManager;
