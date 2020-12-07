module.exports = {
    testEnvironment: "./tests/helpers/test-environment.js",
    globalSetup: "./tests/helpers/global-setup.js",
    globalTeardown: "./tests/helpers/global-teardown.js",
    coveragePathIgnorePatterns: ["/node_modules/"], // default
    coverageReporters: ["json", "clover"],
    displayName: {
      name: "TWIDDLEBUG - KAHOLO AGENT",
      color: "blue"
    },
    projects: ["./tests"],
    collectCoverage: false,
    forceExit: true,
    bail: true,
    runner: "jest-runner",
    testRunner: "jest-circus/runner",
    globals: {}
  };
  