const express = require("express");
const router = express.Router();

const executionController = require("../controllers/execution.controller");

router.post('/', executionController.status);
router.post('/add', executionController.add);
router.post('/cancel', executionController.cancel);

module.exports = router;