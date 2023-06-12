const crypto = require("crypto");

let privateKey;
let publicKey;
// passphrase is required, but we don't really care what it is, so just generate random string
const passphrase = crypto.randomBytes(24).toString("hex");

function generateKeys() {
  ({ publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase,
    },
  }));

  privateKey = crypto.createPrivateKey({
    key: privateKey,
    format: "pem",
    passphrase,
  });

  return { publicKey };
}

function getEncryptedTimestamp() {
  const timestamp = Date.now();

  return crypto
    .privateEncrypt(privateKey, Buffer.from(`${timestamp}`))
    .toString("base64");
}

function decodeEncryptedWithPrivateKey(value) {
  return crypto
    .publicDecrypt(publicKey, Buffer.from(value, "base64"))
    .toString();
}

function decodeEncryptedWithPublicKey(value) {
  return crypto
    .privateDecrypt(privateKey, Buffer.from(value, "base64"))
    .toString();
}

module.exports = {
  generateKeys,
  getEncryptedTimestamp,
  decodeEncryptedWithPrivateKey,
  decodeEncryptedWithPublicKey
};
