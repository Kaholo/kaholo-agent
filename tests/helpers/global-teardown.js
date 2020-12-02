module.exports = async () => {
    await new Promise(resolve => {
      global.agent.close(resolve);
    });
  };
  