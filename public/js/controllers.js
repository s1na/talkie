/* jshint globalstrict: true */
"use strict";

/* Controllers */

angular.module('talkie.controllers', []).
  controller('ChatCtrl', function ($scope, $http, socket, userS, notifS) {
    $scope.user = {};
    $scope.notif = notifS;
    console.log($scope.notif.show);

    $scope.getData = function() {
      var res = userS.getUser();
      if (typeof res.then === 'function') {
        res.then(function(data) {
          $scope.user = data;
        });
      } else {
        $scope.user = res;
      }
    };

    $scope.introduceSelf = function() {
      socket.emit('set:session');
    };

    $scope.findStranger = function() {
      socket.emit('stranger:req');

      socket.on('stranger:res', function(data) {
        console.log('stranger respone came!');
        console.log(data);
      });
    };
  });
