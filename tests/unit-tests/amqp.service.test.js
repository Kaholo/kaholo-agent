const amqpService = require("../../api/services/amqp.service");

describe("amqp service test", () => {
  it("should send message to queue", async () => {
      // sendToQueue(queue, vhost, message, opts = {})
    const spy = jest.spyOn(amqpService, "sendToQueue");
    const message = amqpService.sendToQueue.sendToQueue(queue, vhost, message, opts = {});
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
