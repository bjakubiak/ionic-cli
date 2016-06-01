'use strict';

require('colors');

var extend = Object.assign || require('util')._extend; // eslint-disable-line no-underscore-dangle
var childProcess = require('child_process');
var IonicAppLib = require('ionic-app-lib');
var appLibUtils = IonicAppLib.utils;
var ioLib = IonicAppLib.ioConfig;
var log = IonicAppLib.logging.logger;
var bower = require('../utils/bower');

var settings = {
  title: 'add',
  name: 'add',
  summary: 'Add an Ion, bower component, or addon to the project',
  args: {
    '[name]': 'The name of the ion, bower component, or addon you wish to install'
  },
  isProjectTask: true
};

function installBowerComponent(componentName) {
  var bowerInstallCommand = 'bower install --save-dev ' + componentName;

  var result = childProcess.exec(bowerInstallCommand);

  if (result.code !== 0) {

    // Error happened, report it.
    var errorMessage = 'Bower error, check that "'.red.bold + componentName.verbose + '"'.red.bold +
      ' exists,'.red.bold + '\nor try running "'.red.bold + bowerInstallCommand.verbose + '" for more info.'.red.bold;

    appLibUtils.fail(errorMessage, 'add');
  } else {
    log.info('Bower component installed - ' + componentName);
  }
}

/**
 * Need to look at bower.json of package just installed and look for any cordova plugins required
 * Check the directory in the projects `.bowerrc` file
 * Then go to /path/to/bower/components/<ionic-service-componentName>/ionic-plugins.json - 'plugins'
 * For each plugins - call 'ionic add plugin <current-required-plugin>'
 */
function run(ionic, argv) {

  if (!bower.checkForBower()) {
    appLibUtils.fail(bower.installMessage, 'add');
    return;
  }

  var componentName = argv._[1];
  var ioSet = false;

  try {
    ioSet = true;
    installBowerComponent(componentName);
  } catch (error) {
    var errorMessage = error.message ? error.message : error;
    appLibUtils.fail(errorMessage, 'service');
  }

  // Inject the component into our index.html, if necessary, and save the app_id
  ioLib.injectIoComponent(ioSet, componentName);
  ioLib.warnMissingData();
}

module.exports = extend(settings, {
  run: run
});
