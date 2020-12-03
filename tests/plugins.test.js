const supertest = require("supertest");
const { configureSuperTest } = require("./helpers/supertest.wrapper");

describe("Plugins tests", () => {
  let request;
  beforeEach(() => {
    request = configureSuperTest(supertest);
  });
  describe("POST /", () => {
    it("should return list of plugins", async () => {
      const { body, statusCode } = await request.post(`/plugins/upload`);
      expect(statusCode).toBe(200);
      expect(body).toBeTruthy();
    });
  });
});
