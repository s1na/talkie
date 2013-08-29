/* jshint globalstrict: true */
"use strict";

/* Controllers */

angular.module('talkie.controllers', []).
  controller('ChatCtrl', function ($scope, $http, socket) {
    $scope.nickname = '';

    function getData($http) {
      $http.get('/api/user-data').success(function(data) {
        $scope.nickname = data.nickname;
      }).error(function(data) {
      });
    }

    /*socket.on('send:name', function (data) {
      $scope.name = data.name;
    });*/
  });
