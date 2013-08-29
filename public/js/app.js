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

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'partials/landing-page',
      controller: 'MyCtrl1'
    }).
    when('/view2', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    otherwise({
      redirectTo: '/view1'
    });

  $locationProvider.html5Mode(true);
});
