module.exports = {
  configureSuperTest(
    supertest,
    options = {
      apiUrl: "localhost:8090/api",
    }
  ) {
    return supertest.agent(options.apiUrl);
  },
};
