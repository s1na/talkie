/* jshint globalstrict: true */
"use strict";

/* Controllers */

angular.module('talkie.controllers', []).
  controller('ChatCtrl', function ($rootScope, $scope, $http, $window,
                                   $document, socket, userS, notifS,
                                   loadingS, titleS, msgS
                                  ) {
    $rootScope.title = titleS;

    $scope.user = {};
    $scope.msg = msgS;
    $scope.notif = notifS;
    $scope.loading = loadingS;
    $scope.strangerName = '';

    $window.onfocus = function () {
      titleS.removeUnseenMsgs();
      titleS.unseenMsgs = 0;
    };

    $document.onblur = $window.onblur;
    $document.focus = $window.focus;


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
      clearEnv();
      loadingS.on();
      socket.emit('stranger:req');
    };

    socket.on('stranger:res', function(data) {
      userS.setStranger(data.fullName);
      loadingS.trigger();
    });

    socket.on('stranger:disconnected', function(data) {
      clearEnv();
      loadingS.trigger();
      $scope.findStranger();
    });

    socket.on('error', function (data) {
      notifS.set(
        'مشکلی در ارتباط با سرور پیش آمده.',
        'err'
      );
    });

    socket.on('stranger:err', function (data) {
      notifS.set(
        'مشکلی در پیدا کردن فردی برای شما پیش آمده.',
        'err'
      );
    });

    socket.on('server:logout', function (data) {
      $window.location = '/';
    });

    function clearEnv() {
      userS.setStranger('');
      $scope.msg.msgs = [];
      $scope.msg.curMsg = '';
    }
  }).
  controller('MsgController', function($scope, socket,
                                       userS, notifS, titleS
                                      ) {
    $scope.strangerTyping = false;

    $scope.sendMsg = function () {
      var msg = $scope.msg.curMsg;
      socket.emit('msg:send', {msg: msg});
      $scope.msg.msgs.push({text: msg, from: 'me'});
      $scope.msg.curMsg = '';
    };

    $scope.typing = function () {
      var status = 'typing';
      if (!$scope.msg.curMsg) {
        status = 'cleared';
      }

      socket.emit('msg:typing', status);
    };

    socket.on('msg:recv', function (data) {
      $scope.msg.msgs.push({text: data.msg, from: userS.stranger});
      $scope.strangerTyping = false;
      titleS.newMsg();
    });

    socket.on('msg:strangerTyping', function (data) {
      if (data == 'typing') {
        $scope.strangerTyping = true;
      } else if (data == 'cleared') {
        $scope.strangerTyping = false;
      }
    });
  });
