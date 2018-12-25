const express = require("express");
const router = express.Router();

const multer = require("multer");

const pluginsController = require("../controllers/plugins.controller");

router.use(function(req ,res, next){
    multer({ dest: './uploads/' }).single('file')(req,res,function(err){
        next();
    })
});

router.post('/', pluginsController.list);
router.post('/install', pluginsController.install);
router.post('/delete', pluginsController.delete);

module.exports = router;