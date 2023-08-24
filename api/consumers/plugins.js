const { VHOST, flowConsumer, AgentTypeEnum } = require("@kaholo/shared");
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
        console.error("Error during removing plugin", data.requestData, err);

        return {
          ok: false,
          responseData: { error: err?.stack },
        };
      }
    },
  });

  await flowConsumer({
    queue: "Twiddlebug/InstallPlugin/{agentKey}",
    queueParams: { agentKey: process.env.AGENT_KEY },
    vhost: VHOST.ACTIONS,
    prefetchValue: 1,
    callback: async (data) => {
      try {
        if (!data.requestData.id) {
          throw new Error("Missing plugin id");
        }
        const pluginId = data.requestData.id;
        const uploadDirPath = resolve(__dirname, "..", "..", "uploads");

        const uploadPath = resolve(uploadDirPath, `${pluginId}.zip`);

        await fs.mkdir(uploadDirPath, { recursive: true });

        const response = await fetch(
          `${process.env.SERVER_URL}/api/plugins/download/${pluginId}`,
          {
            headers: {
              "x-agent-key": process.env.AGENT_KEY,
              "x-agent-type": process.env.DYNAMIC_AGENT === "true" ? AgentTypeEnum.DYNAMIC : AgentTypeEnum.STATIC,
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
        await pluginsService.deleteZipFile(pluginId);

        return {
          ok: true,
          responseData: {},
        };
      } catch (err) {
        console.error("Error during installing plugin", data.requestData, err);

        return {
          ok: false,
          responseData: { error: err?.stack },
        };
      }
    },
  });
};
