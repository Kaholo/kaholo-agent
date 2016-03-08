/**
 * Text editor module
 *
 * Creates & updates text files
 */
var fs = require('fs');
var q = require('q');

exports = {
    name: "Text Editor",
    /**
     * creates new file at specific path with content
     *
     * @param path the new file path
     * @param content the new file content
     *
     */
    createNewFileWithContent: function(action) {
        var path = action.params.path, 
            content = action.params.content;
        var deferred = q.defer();
        fs.writeFile(path, content, function(err) {
            if(err) {
                console.log(err);
                return deferred.resolve({"error": err});
            } else {
                console.log('file created!');
                return deferred.resolve({"res": 'file ' + path +' created!'});
            }
        });
        return deferred.promise;
    },
    /**
     * appends text to the end of a file
     *
     * @param path path to edited file
     * @param textToAdd text to append
     *
     */
    appendToFile: function(action){
        var path = action.params.path, 
            content = action.params.content;
        var deferred = q.defer();
        fs.appendFile(path, content, function(err) {
            if(err) {
                console.log(err);
                return deferred.resolve({"error": err});
            } else {
                console.log('text appended!');
                return deferred.resolve({"res": 'file ' + path +' updated!'});
            }
        });
        return deferred.promise;
    },
    /**
     * search a regular expression in file
     *
     * @param path
     * @param regex
     * @returns boolean value indicating if the file contains a string that matches this regex
     */
    searchInFile: function(action){
        var path = action.params.path, 
            regex = action.params.regex;
        var deferred = q.defer();
        fs.readFile(path, 'utf8', function (err,data) {
            if (err) {
                return deferred.resolve({"error": err});
            }
            var patt = new RegExp(regex);
            var res = patt.test(data);
            return deferred.resolve({status: res ? 1 : -1});
        });
        return deferred.promise;
    },
    /**
     * search and replace in file
     *
     * @param path
     * @param regex
     * @param newStr
     * @returns {*}
     */
    searchAndReplace: function(action){
        var path = action.params.path, 
            newStr = action.params.newStr, 
            regex = action.params.regex;
        var deferred = q.defer();
        fs.readFile(path, 'utf-8', function(err, data){
            if (err) {
                return deferred.resolve({"error": err});
            }
            var newVal = data.replace(new RegExp(regex, 'g'), newStr);
            fs.writeFile(path, newVal, 'utf-8', function (err) {
                if (err) {
                    return deferred.resolve({"error": err});
                }
                return deferred.resolve({'res': 'text replaced!'});
            });
        });
        return deferred.promise;
    }
}