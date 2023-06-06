jest.mock('net', () => ({
  Socket: function() {
    return {
      connect() {
        throw undefined;
      }
    }
  }
}))

describe("worker test", () => {
  let argv, exit;

  // Overwrite is required because worker is a executor, cli based script
  beforeEach(() => {
    orgArgv = process.argv;
    argv = JSON.stringify(process.argv);
    exit = process.exit;
  })

  afterEach(() => {
    process.argv = orgArgv;
    process.exit = exit;
  })

  it("should exit 1 if error is undefined", async () => {
    let result;
    process.exit = (number) => result = number;
    process.argv = [
      '/usr/local/bin/node',
      '/twiddlebug/workers/node.js',
      '',
      '{"test": "test"}'
    ];

    try{
      require("../../workers/node");
    }catch (err) {
      console.info(err);
    }
    expect(result).toBe(1);
  });


  it("should exit if no parameters", async () => {
    jest.requireActual('net');
    let result;
    process.exit = (number) => result = number;
    process.argv = [];
    try {
      require("../../workers/node");
    } catch (err) {
      console.info(err);
      expect(result).toBe(9);
    }
  });

  it("should exit 100 if no executor file found", async () => {
    jest.requireActual('net');
    let result;
    process.exit = (number) => result = number;
    process.argv = ['','','wrongpath'];
    try {
      require("../../workers/node");
    } catch (err) {
      console.info(err);
      expect(result).toBe(100);
    }
  });

  });
