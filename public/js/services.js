/* jshint globalstrict: true */
"use strict";

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('talkie.services', []).
  value('version', '0.1').
  service('userS', function ($http, $q) {
    var user;
    this.stranger = '';

    this.fetchUserData = function () {
      var defer = $q.defer();
      $http.get('/api/user-data').success(function (data) {
        defer.resolve(data);
      }).error(function (data) {
      });
      return defer.promise;
    };

    this.getUser = function () {
      var defer = $q.defer();
      if (typeof user === 'undefined') {
        return this.fetchUserData().then(function (data) {
          user = data;
          defer.resolve(user);
          return defer.promise;
        });
      }
      return user;
    };

    this.setStranger = function (name) {
      this.stranger = name;
    };
  }).
  service('notifS', function () {
    this.msg = null;
    this.type = 'err';
    this.show = false;

    this.set = function (msg, type) {
      this.msg = msg;
      this.type = type;
      this.show = true;
    };

    this.clear = function () {
      this.show = false;
      this.msg = null;
      this.type = null;
    };
  }).
  service('loadingS', function () {
    this.enable = false;

    this.on = function () {
      this.enable = true;
    };

    this.off = function () {
      this.enable = false;
    };

    this.trigger = function () {
      this.enable = !this.enable;
    };
  });
