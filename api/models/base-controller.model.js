class BaseController{
    constructor(){
        const keys = Object.getOwnPropertyNames(this.__proto__);
        for (let i = 0, length=keys.length; i < length; i++) {
            const key = keys[i];
            if(typeof this[key] === 'function')
                this[key] = this[key].bind(this);
        }
    }
}

module.exports = BaseController;
