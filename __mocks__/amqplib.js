const createChannelSpy = jest
  .fn()
  .mockImplementation(() => Promise.resolve({}));

module.exports = {
  connect: () =>
    Promise.resolve({
      createChannel: createChannelSpy,
    }),
  createChannelSpy,
};
