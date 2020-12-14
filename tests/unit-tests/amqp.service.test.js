const amqpService = require("../../api/services/amqp.service");
const amqplibMock = require("../../__mocks__/amqplib");

describe("amqp service test", () => {
  it("should connect to actions queue and return channel", async () => {
    const channel = await amqpService.connectToActions();
    expect(amqplibMock.createChannelSpy).toHaveBeenCalled();
    expect(channel).toBeTruthy();
  });
});
