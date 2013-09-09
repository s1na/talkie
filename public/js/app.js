/* jshint globalstrict: true */
"use strict";

// Declare app level module which depends on filters, and services

var app = angular.module('talkie', [
  'talkie.controllers',
  'talkie.filters',
  'talkie.services',
  'talkie.directives',

  // 3rd party dependencies
  'btford.socket-io'
]);

app.config(['$locationProvider', function ($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
