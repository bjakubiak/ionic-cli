'use strict';

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var _ = require('underscore');
var extend = Object.assign || require('util')._extend; // eslint-disable-line no-underscore-dangle
var bower = require('../utils/bower');
var log = require('ionic-app-lib').logging.logger;
var IonicAppLib = require('ionic-app-lib');
var fail = IonicAppLib.utils.fail;

var settings = {
  title: 'service add',
  name: 'service',
  summary: 'Add an Ionic service package and install any required plugins',
  args: {
    '[options]': '',
    '<SPEC>': 'Can be a service name or a git url'
  },
  isProjectTask: true
};

function readIonicProjectJson() {
  var ionicProjectFile = path.join(process.cwd(), 'ionic.project');
  var ionicProjectJson = null;
  try {
    var content = fs.readFileSync(ionicProjectFile, 'utf8');
    ionicProjectJson = JSON.parse(content);
  } catch (ex) {
    throw ex;
  }

  return ionicProjectJson;
}

function addServiceToIonicJson(serviceName) {
  var ionicProjectFile = path.join(process.cwd(), 'ionic.project');

  try {
    var ionicProjectJson = readIonicProjectJson() || {};

    if (!ionicProjectJson.services) {
      ionicProjectJson.services = [];
    }

    var existingProject = _.findWhere(ionicProjectJson.services, { name: serviceName });
    if (typeof existingProject != 'undefined') {
      return;
    }

    ionicProjectJson.services.push({ name: serviceName });
    fs.writeFileSync(ionicProjectFile, JSON.stringify(ionicProjectJson, null, 2), 'utf8');

  } catch (ex) {
    fail('Failed to update the ionic.project settings for the service', 'service');
  }
}

function installBowerComponent(serviceName) {
  var bowerInstallCommand = 'bower link ionic-service-' + serviceName;
  var result = exec(bowerInstallCommand);

  if (result.code !== 0) {

    // Error happened, report it.
    var errorMessage = 'Failed to find the service "'.bold + serviceName.verbose +
      '"'.bold + '.\nAre you sure it exists?'.bold;
    fail(errorMessage, 'service');
  } else {
    addServiceToIonicJson(serviceName);
  }
}

function uninstallBowerComponent(serviceName) {
  var bowerUninstallCommand = 'bower unlink ionic-service-' + serviceName;

  var result = exec(bowerUninstallCommand);

  if (result.code !== 0) {
    var errorMessage = 'Failed to find the service "'.bold + serviceName.verbose +
      '"'.bold + '.\nAre you sure it exists?'.bold;
    fail(errorMessage, 'service');
  }
}

function getBowerComponentsLocation() {
  var bowerRcFileLocation = path.join(process.cwd(), '.bowerrc');
  var bowerRc = null;

  try {
    var content = fs.readFileSync(bowerRcFileLocation, 'utf8');
    bowerRc = JSON.parse(content);
  } catch (ex) {
    throw ex;
  }

  var directory = 'www/lib'; // Default directory

  if (bowerRc && bowerRc.directory) {
    directory = bowerRc.directory;
  }

  return directory;
}

function getBowerJson(directory, serviceName) {
  var bowerJsonLocation = path.join(process.cwd(), directory, 'ionic-service-' + serviceName, 'ionic-plugins.json');
  var packageBowerJson = require(bowerJsonLocation);
  return packageBowerJson;
}

function installBowerPlugins(directory, serviceName) {
  var packageBowerJson = getBowerJson(directory, serviceName);

  _.each(packageBowerJson.plugins, function(plugin) {
    log.info('Installing cordova plugin - ' + plugin.name + ' (' + plugin.id + ')');
    var installPluginCmd = 'ionic plugin add ' + plugin.uri;
    log.info(installPluginCmd);
    var pluginInstallResult = exec(installPluginCmd);

    if (pluginInstallResult.code !== 0) {
      var errorMessage = 'Failed to find the plugin "'.bold + plugin.name.verbose + '"'.bold + '.'.bold;
      fail(errorMessage, 'service');
    }
  });
}

function uninstallBowerPlugins(bowerJson) {
  _.each(bowerJson.plugins, function(plugin) {
    log.info('Uninstalling cordova plugin -  ' + plugin.name);
    var uninstallPluginCmd = 'ionic plugin rm ' + plugin.id;
    log.info(uninstallPluginCmd);
    var pluginRemoveResult = exec(uninstallPluginCmd);

    if (pluginRemoveResult.code !== 0) {
      var errorMessage = 'Failed to find the plugin to remove "'.bold + plugin.name.verbose + '"'.bold + '.'.bold;
      fail(errorMessage, 'service');
    }
  });
}

function addService(serviceName) {
  installBowerComponent(serviceName);

  var directory = getBowerComponentsLocation();

  log.info('Checking for any plugins required by service package');

  installBowerPlugins(directory, serviceName);
  log.info('ionic service add completed');
}

function removeService(serviceName) {
  var directory = getBowerComponentsLocation();
  var packageBowerJson = this.getBowerJson(directory, serviceName);

  uninstallBowerComponent(serviceName);

  uninstallBowerPlugins(packageBowerJson);
}

// Need to look at bower.json of package just installed and look for any cordova plugins required
// Check the directory in the projects `.bowerrc` file
// Then go to /path/to/bower/components/<ionic-service-serviceName>/ionic-plugins.json - 'plugins'
// For each plugins - call 'ionic add plugin <current-required-plugin>'
function run(ionic, argv) {

  if (!bower.IonicBower.checkForBower()) {
    fail(bower.IonicBower.installMessage, 'service');
    return;
  }

  var action = argv._[1];
  var serviceName = argv._[2];

  try {
    switch (action) {
    case 'add':
      addService(serviceName);
      break;
    case 'remove':
      removeService(serviceName);
      break;
    }
  } catch (error) {
    var errorMessage = error.message ? error.message : error;
    fail(errorMessage, 'service');
  }
}

module.exports = extend(settings, {
  readIonicProjectJson: readIonicProjectJson,
  addServiceToIonicJson: addServiceToIonicJson,
  installBowerComponent: installBowerComponent,
  uninstallBowerComponent: uninstallBowerComponent,
  getBowerComponentsLocation: getBowerComponentsLocation,
  getBowerJson: getBowerJson,
  installBowerPlugins: installBowerPlugins,
  uninstallBowerPlugins: uninstallBowerPlugins,
  addService: addService,
  removeService: removeService,
  run: run
});
