/* jshint globalstrict: true */
"use strict";

/* Controllers */

angular.module('talkie.controllers', []).
  controller('ChatCtrl', function ($scope, $http,
                                   socket, userS, notifS,
                                   loadingS
                                  ) {
    $scope.user = {};
    $scope.notif = notifS;
    $scope.loading = loadingS;

    $scope.getData = function () {
      var res = userS.getUser();
      if (typeof res.then === 'function') {
        res.then(function (data) {
          $scope.user = data;
        });
      } else {
        $scope.user = res;
      }
    };

    $scope.introduceSelf = function () {
      socket.emit('set:session');
    };

    $scope.findStranger = function () {
      loadingS.on();
      socket.emit('stranger:req');

      socket.on('stranger:res', function (data) {
        console.log('stranger respone came!');
        console.log(data);
      });
    };

    socket.on('error', function (data) {
      notify.set(
        msg='مشکلی در ارتباط با سرور پیش آمده.',
        type='err'
      );
    });

    socket.on('stranger:err', function (data) {
      notify.set(
        msg='مشکلی در پیدا کردن فردی برای شما پیش آمده.',
        type='err'
      );
    });
  });
