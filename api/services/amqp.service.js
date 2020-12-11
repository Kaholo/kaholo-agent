const { connect } = require('amqplib');
const fs = require("fs");

const VHOST_RESULTS = 'results';
const VHOST_ACTIONS = 'actions';
let connection = {}, channel = {};

const opts = {
    rejectUnauthorized: false,
    cert: fs.readFileSync("./config/certs/client_certificate.pem"),
    key: fs.readFileSync("./config/certs/client_key.pem")
};
 
async function connectToAMQP(vhost) {
    const conn = await connect(`amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`, opts);
    if (conn) {
        connection[vhost] = conn;
    }
    return conn;
}

async function connectToActions() {
    return amqpConnect(VHOST_ACTIONS);
}

async function connectToResults() {
    return amqpConnect(VHOST_RESULTS);
}

async function createChannel(vhost) {
    const ch = await connection[vhost].createChannel();
    if (ch) {
        channel[vhost] = ch;
    }
    return ch;
}

async function checkIfQueueExists(queue, vhost) {
    return channel[vhost].checkQueue(queue);
}

async function sendToQueue(queue, message, opts = {}) {
    return channel.sendToQueue(queue, message, opts);
}

async function consumeQueue(queue, vhost, cb, opts = []) {
    const exists = await checkIfQueueExists(queue, vhost);
    if (exists) {
        return channel[vhost].consumeQueue(queue, cb, opts);
    }
    throw new Error(`Agent queue ${queue} does not exist!`);
}

async function amqpConnect(vhost) {
    const conn = await connectToAMQP(vhost);
    if (conn) {
        const ch = await createChannel(vhost);
        if (ch) {
            return ch;
        }
        throw new Error("Could not create AMQP channel!");
    } else {
        throw new Error("Could not connect to AMQP queue!");
    }
}

module.exports = {
    connectToActions,
    connectToResults,
    sendToQueue,
    consumeQueue,
    VHOST_RESULTS,
    VHOST_ACTIONS
}