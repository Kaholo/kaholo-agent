const { beforeAll } = require("jest-circus");
const amqpService = require("../../api/services/amqp.service");
const amqplibMock = require("../../__mocks__/amqplib");
const fs = require("fs");

describe("amqp service test", () => {
  beforeAll(() => {
    amqpService.configure({
      rejectUnauthorized: false,
      cert: fs.readFileSync(`${__dirname}/../../${process.env.AMQP_CERT_PATH}`),
      key: fs.readFileSync(`${__dirname}/../../${process.env.AMQP_KEY_PATH}`)
    });
  });
  
  it("should connect to actions queue", async () => {
    await amqpService.connectToActions(() => {});
    expect(amqplibMock.createChannelSpy).toHaveBeenCalled();
  });
});
