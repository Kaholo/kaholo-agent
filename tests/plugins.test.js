const supertest = require("supertest");
const { configureSuperTest } = require("./helpers/supertest.wrapper");

describe("Plugins tests", () => {
  let request;
  beforeEach(() => {
    request = configureSuperTest(supertest);
  });
  describe("POST /api/plugins", () => {
    it("should return list of plugins", async () => {
      const { body, statusCode } = await request.post(`/plugins/`);
      expect(statusCode).toBe(200);
      // TODO: write a proper test with installing plugins
      // https://kaholo.atlassian.net/browse/KAH-958 raised
      expect(body).toBeTruthy();
    });
  });
});
