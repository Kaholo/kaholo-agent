const NodeEnvironment = require("jest-environment-node");

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }

  handleTestEvent() {
  }
}

module.exports = CustomEnvironment;
