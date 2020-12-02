module.exports = {
  configureSuperTest(
    supertest,
    options = {
      apiUrl: "localhost:3000/api",
    }
  ) {
    return supertest.agent(options.apiUrl);
  },
};
