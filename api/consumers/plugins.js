const { VHOST, eventsWorker, flowConsumer } = require("@kaholo/shared");
const pluginsService = require("../services/plugins.service");
const { spawnSync } = require("child_process");
const { resolve } = require("path");
const fetch = require("node-fetch");
const fs = require("fs/promises");
const { getEncryptedTimestamp, decodeEncryptedWithPublicKey } = require("../../utils/crypto");

const serverTimestampThreshold = 1000 * 60 * 5; // 5 minutes

async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

module.exports = async function initPluginConsumers() {
  await flowConsumer({
    queue: "Twiddlebug/RemovePlugin/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: async (data) => {
      try {
        const pluginName = data.requestData.name;

        await pluginsService.delete(pluginName);
        
        return {
          ok: true,
          responseData: {}
        };
      } catch (err) {
        console.error(err);

        return {
          ok: false,
          responseData: {
            error: `${err}`, // just to make it string even if is undefined
          }
        };
      }
    },
  });

  await flowConsumer({
    queue: "Twiddlebug/InstallPlugin/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    callback: async (data) => {
      if (!data.requestData.id) {
        // Do not throw error here, as we want rpc response to bigbird to pass with fail
        return {
          ok: false,
          error: "Missing plugin id",
        };
      }

      try {
        const pluginId = data.requestData.id;
        const uploadDirPath = resolve(__dirname, "..", "..", "uploads");

        const uploadPath = resolve(uploadDirPath, `${pluginId}.zip`);

        await fs.mkdir(uploadDirPath, { recursive: true });

        const response = await fetch(
          `${process.env.SERVER_URL}/api/plugins/download/${pluginId}`,
          {
            headers: {
              "x-agent-key": process.env.AGENT_KEY,
              "x-agent-timestamp": getEncryptedTimestamp()
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to download plugin ${pluginId}`);
        }

        const serverTimestamp = response.headers.get("x-server-timestamp");
        const timestamp = decodeEncryptedWithPublicKey(serverTimestamp);

        if (Date.now() - timestamp > serverTimestampThreshold) {
          throw new Error(`Server timestamp is expired`);
        }

        const file = await blobToBuffer(await response.blob());

        await fs.writeFile(uploadPath, file);

        await pluginsService.install(uploadPath);

        return {
          ok: true,
          responseData: {},
        };
      } catch (err) {
        console.error(err);

        return {
          ok: false,
          responseData: { error: `${err}` }, // just to make it string even if is undefined
        };
      }
    },
  });
};
