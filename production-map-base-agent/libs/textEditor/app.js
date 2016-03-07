/**
 * Production map text editor agent
 *
 * @Author Ilan Yaniv & Tal Levi
 */

var textEditor = require('./textEditor');
var express = require('express');
var app = express();
//app.use(express.bodyParser());

var CREATE_NEW_FILE = 'create new file';
var APPEND_TO_FILE = 'Append to file';
var FIND_IN_FILE = 'find in file';
var FIND_REPLACE = 'find and replace';

app.post('/register', function(req, res){
    var method = req.body.method.viewName;

    switch (method) {
        case CREATE_NEW_FILE:
            console.log("creating new file");
            textEditor.createNewFileWithContent(action.params.path, action.params.text, action.params.force, function(val){
                return res.send({"res": val+''});
            },function(err){
                return res.send({"error": err+''});
            });
            break;
        case APPEND_TO_FILE:
            textEditor.updateFile(action.params.path, action.params.text, function(val){
                return res.send({"res": val+''});
            },function(err){
                return res.send({"error": err+''});
            });
            break;
        default:
            return res.send({"error": "no such method on dedicated agnet"});
            break;
    }
});


app.listen(3000, function(){
    console.log('server listening at 3000');
    textEditor.createNewFileWithContent('myfile.txt', 'Hello world!').then(function(){
        console.log('appending text...');
        textEditor.appendToFile('myfile.txt', '\n its me!').then(function(){
            textEditor.searchInFile('myfile.txt', 'its').then(function(data){
                console.log(data);
                textEditor.searchAndReplace('myfile.txt', 'l', '1').then(console.log);
            })
        })
    });
})

