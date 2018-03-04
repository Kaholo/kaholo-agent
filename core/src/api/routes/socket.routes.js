const express = require("express");
const router = express.Router();

const socketController = require("../controllers/socket.controller");

router.post('/', socketController.subscribeToSocket);

module.exports = router;