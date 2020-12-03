const { startAgent } = require("../../app");

module.exports = async () => {
  global.agent = await startAgent();
};
