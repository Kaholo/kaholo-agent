const exec = require('child_process').exec;

module.exports = async function(cmd){
    return new Promise((resolve,reject)=>{
        exec(cmd, function (error, stdout, stderr){
            if(error) return reject({error, stdout})
            resolve({stdout});
        })
    })
}