
const { spawn } = require('child_process');

describe("agent register test", () => {
    // TODO: investigate why spawn('node', ['app.js']) is received 0 in test
    // while eg. spawn('sh', ['-c', 'exit 1']) is received 1 in test, properly
    it.skip("should exit with code 1 on register fail", (done) => {
        const subprocess = spawn('node', ['app.js']);

        subprocess.on('exit', (code) => {
            if (code !== 0) {
                console.log(` process exited with code ${code}`);
            }
            expect(code).toEqual(1);
            done()
        });
    });
});
 