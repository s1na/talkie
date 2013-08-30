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
    $scope.strangerName = '';

    $scope.init = function () {
      $scope.getData();

      $scope.findStranger();
    };

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

    $scope.findStranger = function () {
      loadingS.on();
      socket.emit('stranger:req');
    };

    socket.on('stranger:res', function(data) {
      userS.setStranger(data.fullName);
      loadingS.trigger();
    });

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
  }).
  controller('MsgController', function($scope, socket, userS, notifS) {
    $scope.msgs = [];
    $scope.curMsg = '';

    $scope.filter = function () {
      console.log('here');
    };

    $scope.sendMsg = function () {
      var msg = $scope.curMsg
      socket.emit('msg:send', {msg: msg});
      $scope.msgs.push({text: msg, from: 'me'});
      $scope.curMsg = '';
    };

    socket.on('msg:recv', function (data) {
      $scope.msgs.push({text: data['msg'], from: userS.stranger});
    });
  });
