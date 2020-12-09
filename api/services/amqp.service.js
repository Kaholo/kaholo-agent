const { connect } = require('amqplib');

const connection, channel;

const opts = {
    cert: fs.readFileSync('clientcert.pem'),
    key: fs.readFileSync('clientkey.pem'),
    passphrase: 'MySecretPassword',
    ca: [fs.readFileSync('cacert.pem')]
};
 
async function amqpConnect() {
    const conn = await connect(`amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}`, opts);
    if (conn) {
        connection = conn;
    }
    return conn;
}

async function createChannel() {
    const ch = await connection.createChannel();
    if (ch) {
        channel = ch;
    }
    return ch;
}

function checkIfQueueExists(queue) {
    return connection.checkQueue(queue);
}

async function sendToQueue(queue, message, opts = {}) {
    return channel.sendToQueue(queue, message, opts);
}

function consumeQueue(queue, cb, opts = []) {
    const queue = await checkIfQueueExists(queue);
    if (queue) {
        return channel.consumeQueue(queue, (msg) => cb(msg, () => channel.ack(msg)), opts);
    }
    throw new Error(`Agent queue ${queue} does not exist!`);
}

async function connect() {
    const conn = await amqpConnect();
    if (conn) {
        const ch = await createChannel();
        if (ch) {
            return ch;
        }
        throw new Error("Could not create AMQP channel!");
    } else {
        throw new Error("Could not connect to AMQP queue!");
    }
}

module.exports = {
    connect,
    sendToQueue,
    consumeQueue
}