const express = require("express");
const router = express.Router();

const multer = require("multer");

const pluginsController = require("../controllers/plugins.controller");

router.use(multer({ dest: './uploads/' }).single('file'));

router.post('/', pluginsController.list);
router.post('/install', pluginsController.install);
router.post('/delete', pluginsController.delete);
router.get('/autocomplete-function/:pluginName/:functionName', pluginsController.getAutocompleteFromFunction);


module.exports = router;