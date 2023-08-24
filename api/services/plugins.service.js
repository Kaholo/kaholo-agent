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

    try {
      await zip.extract(zipFilePath, tmpPath);
    } catch (error) {
      console.error("Error unzipping plugin ", error);
      await fs.remove(tmpPath);
      throw error;
    }

    // Validate the plugin directory
    const pluginConf = await this.validatePluginDirectory(tmpPath);

    // Move TMP extraction dir to final installation path
    const pluginInstallPath = path.join(
      process.env.PLUGINS_DIR_PATH,
      pluginConf.name
    );
    try {
      await fs.move(tmpPath, pluginInstallPath, { overwrite: true });
      await fs.remove(tmpPath);
    } catch (err) {
      // Need to clear both directories in case of failure as currently we're identifying by the directory if the plugin is installed
      await fs.remove(tmpPath);
      await fs.remove(pluginInstallPath);
      throw `Failed to move plugin files: ${err.message}`;
    }

    // Install plugin dependencies
    await this.installPluginDependencies(pluginInstallPath, pluginConf);
    
    // Load Plugin
    await this.loadPluginDir(pluginInstallPath);
  }

  async installPluginDependencies(pluginInstallPath, pluginConf) {
    const installPluginDepsCmd = `cd "${pluginInstallPath}" && npm install`;
    try {
      const installationStart = new Date().getTime();
      const result = await exec(installPluginDepsCmd);
      const installationEnd = new Date().getTime();
      console.info(`npm install took:  ${(installationEnd - installationStart) / 1000} seconds`);

      console.info(`${pluginConf.name} successfully installed dependencies:`);
      console.info(result.stdout);
    } catch (err) {
      if (err.error && err.stderr) {
        console.error(`${pluginConf.name} failed to install dependencies:`);
        console.error(err.stderr);
        console.error(err.error);
        throw err.error;
      } else {
        console.error(err);
        throw err;
      }
    }
  }

  async getAutocompleteFromFunction(pluginName, functionName, query, pluginSettings, actionParams) {
    const pluginConf = this.plugins[pluginName];
    let queryFunction;

    if (!pluginConf) {
      throw new Error('Plugin not found!');
    }
    
    queryFunction = requireUncached(pluginConf.main)[functionName];
    
    if (queryFunction && typeof queryFunction === 'function') {
      return queryFunction(query, pluginSettings, actionParams)
    } else {
      throw new Error('Function not found!');
    }
  }

  delete(name) {
    return new Promise((resolve, reject) => {
      rimraf(`/twiddlebug/libs/plugins/${name}`, (err, res) => {
        if (err) return reject(err);
        else return resolve(res);
      });
    });
  }

  deleteZipFile(id) {
    return new Promise((resolve, reject) => {
      rimraf(`/twiddlebug/uploads/${id}.zip`, (err, res) => {
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
