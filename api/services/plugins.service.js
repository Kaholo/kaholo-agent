const fs = require("fs-extra");
const path = require("path");
const rimraf = require("rimraf");
const { v4: uuid4 } = require("uuid");

const zip = require("../../utils/zip");
const exec = require("../../utils/exec");
const decache = require('decache');

function requireUncached(module) {
  decache(module);
  return require(module);
}

class PluginsService {
  constructor() {
    this.plugins = {};
  }

  /**
   * validates the plugin directory and returns the parsed plugin config.
   * @param {string} pluginPath
   * @returns {Object}
   */
  async validatePluginDirectory(pluginPath) {
    const pluginConfFileName = "config.json";
    const isConfFileExists = await fs.exists(
      path.join(pluginPath, pluginConfFileName)
    );
    if (!isConfFileExists) {
      throw `Invalid plugin dir: No ${pluginConfFileName} file (${pluginPath})`;
    }

    let pluginConf;
    try {
      pluginConf = require(path.join(pluginPath, pluginConfFileName));
    } catch (err) {
      throw `Error parsing ${pluginConfFileName}: ${err.message} (${pluginPath})`;
    }

    if (!pluginConf.name) {
      throw `Invalid ${pluginConfFileName}: plugin name missing (${pluginPath})`;
    }

    return pluginConf;
  }

  /**
   * Validates the plugin directory and load it to plugins;
   * @param {string} pluginPath
   */
  async loadPluginDir(pluginPath) {
    const pluginConf = await this.validatePluginDirectory(pluginPath);

    if (!this.plugins.hasOwnProperty(pluginConf.name)) {
      pluginConf.main = path.join(pluginPath, pluginConf.main);
      this.plugins[pluginConf.name] = pluginConf;
    }
    return this.plugins[pluginConf.name];
  }

  async loadAllInsalledPlugins() {
    const pluginsDirData = await fs.readdir(process.env.PLUGINS_DIR_PATH);
    const plugins = [];
    for (let i = 0, length = pluginsDirData.length; i < length; i++) {
      const itemPath = path.join(
        process.env.PLUGINS_DIR_PATH,
        pluginsDirData[i]
      );
      const itemLstat = await fs.lstat(itemPath);

      if (itemLstat.isDirectory()) plugins.push(itemPath);
    }

    return Promise.all(
      plugins.map((pluginPath) => {
        return this.loadPluginDir(pluginPath).catch((err) => {
          console.error(err);
        });
      })
    );
  }

  async install(zipFilePath) {
    // Extarct plugin zip file
    const tmpPath = path.join(
      process.env.BASE_DIR,
      "tmp",
      `${uuid4()}-${new Date().getTime()}`
    );
    await zip.extract(zipFilePath, tmpPath);

    // Validate the plugin directory
    const pluginConf = await this.validatePluginDirectory(tmpPath);

    // Move TMP extraction dir to final installation path
    const pluginInstallPath = path.join(
      process.env.PLUGINS_DIR_PATH,
      pluginConf.name
    );
    try {
      await fs.move(tmpPath, pluginInstallPath, { overwrite: true });
    } catch (err) {
      throw `Failed to install plugin: ${err.message}`;
    }

    // Install plugin dependencies
    const installPluginDepsCmd = `cd "${pluginInstallPath}" && npm install`;
    try {
      const installationStart = new Date().getTime();
      const result = await exec(installPluginDepsCmd);
      const installationEnd = new Date().getTime();
      console.info(`npm install took:  ${(installationEnd - installationStart)/1000} seconds`)

      console.info(`${pluginConf.name} successfully installed dependencies:`);
      console.info(result.stdout);
    } catch (err) {
      if (err.error && err.stderr) {
        console.error(`${pluginConf.name} failed to install dependencies:`);
        console.error(err.stderr);
        console.error(err.error);
        throw err.error;
      } else {
        throw err;
      }
    }

    // Load Plugin
    await this.loadPluginDir(pluginInstallPath);
  }

  async getAutocompleteFromFunction(pluginName, functionName, query, pluginSettings, actionParams) {
    const pluginConf = this.plugins[pluginName];
    let queryFunction;

    if (pluginConf) {
      queryFunction = requireUncached(pluginConf.main)[functionName];
    } else {
      throw new Error('Plugin not found!');
    }

    if (queryFunction && typeof queryFunction === 'function') {
      let autocomplete;
      try {
        autocomplete = queryFunction(query, pluginSettings, actionParams);
      } catch (error) {
        console.error(error);
        throw new Error(`Error in plugin: ${pluginName},  in function: ${functionName}.`);
      }
      return autocomplete;
    } else {
      throw new Error('Function not found!');
    }
  }

  delete(name) {
    return new Promise((resolve, reject) => {
      rimraf(`libs/plugins/${name}`, (err, res) => {
        if (err) return reject(err);
        else return resolve(res);
      });
    });
  }

  getVersions() {
    return Object.keys(this.plugins).reduce((total, current) => {
      total[current] = this.plugins[current].version;
      return total;
    }, {});
  }
}

const pluginsService = new PluginsService();
module.exports = pluginsService;
