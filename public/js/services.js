/* jshint globalstrict: true */
"use strict";

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('talkie.services', []).
  value('version', '0.1').
  service('userS', function($http, $q) {
    var user;

    this.fetchUserData = function() {
      var defer = $q.defer();
      $http.get('/api/user-data').success(function(data) {
        defer.resolve(data);
      }).error(function(data) {
      });
      return defer.promise;
    };

    this.getUser = function() {
      var defer = $q.defer();
      if (typeof user === 'undefined' || _isEmpty(user)) {
        return this.fetchUserData().then(function(data) {
          user = data;
          defer.resolve(user);
          return defer.promise;
        });
      }
      return user;
    };
});
