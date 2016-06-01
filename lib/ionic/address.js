'use strict';

var extend = Object.assign || require('util')._extend; // eslint-disable-line no-underscore-dangle
var IonicAppLib = require('ionic-app-lib');
var Serve = IonicAppLib.serve;

var settings =  {
  title: 'address',
  name: 'address',
  isProjectTask: true
};

function run(ionic, argv) { // eslint-disable-line no-unused-vars

  // reset any address configs
  var ionicConfig = IonicAppLib.config.load();
  ionicConfig.set('ionicServeAddress', null);
  ionicConfig.set('platformServeAddress', null);
  return Serve.getAddress({ isAddressCmd: true });
}

module.exports = extend(settings, {
  run: run
});
