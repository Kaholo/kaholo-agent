module.exports = {
    packagify: (modules) => {
        // returns an object where key's value is the version of the plugin.
        return Object.keys(modules).reduce((total, current) => {
            total[current] = modules[current].version;
            return total;
        }, {});
    }
};