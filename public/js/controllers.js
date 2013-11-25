/* jshint globalstrict: true */
"use strict";

/* Controllers */

angular.module('talkie.controllers', []).
  controller('ChatCtrl', ['$rootScope', '$scope', '$http', '$window',
             '$document', 'socket', 'userS', 'notifS', 'loadingS',
             'titleS', 'msgS', function ($rootScope, $scope, $http, $window,
                                         $document, socket, userS, notifS,
                                         loadingS, titleS, msgS) {
    $rootScope.title = titleS;

    $scope.user = {};
    $scope.stranger = userS.stranger;
    $scope.msg = msgS;
    $scope.notif = notifS;
    $scope.loading = loadingS;
    $scope.reported = false;
    $scope.friends = {};
    $scope.waitingForFriends = true;
    $scope.friendshipRequested = false;

    $window.onfocus = function () {
      titleS.removeUnseenMsgs();
      titleS.unseenMsgs = 0;
    };

    $document.onblur = $window.onblur;
    $document.focus = $window.focus;


    $scope.init = function () {
//      $scope.getData();

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

    $scope.setStranger = function (stranger) {
      $scope.stranger.name = stranger.name;
      $scope.stranger.commonTopics = stranger.commonTopics
      $scope.stranger.otherTopics = stranger.strangerTopics
      $scope.stranger.gravatarUrl = stranger.gravatarUrl;
      if (stranger.commonTopics &&
          typeof stranger.commonTopics !== undefined &&
          stranger.commonTopics.length > 0){
        $scope.stranger.commonTopicsString = stranger.commonTopics.join('، ');
      } else {
        $scope.stranger.commonTopicsString = '';
      }
      if (stranger.strangerTopics &&
          typeof stranger.strangerTopics !== undefined &&
          stranger.strangerTopics.length > 0){
        $scope.stranger.otherTopicsString = stranger.strangerTopics.join('، ');
      } else {
        $scope.stranger.otherTopicsString = '';
      }
    };

    $scope.report = function () {
      socket.emit('stranger:report', {noStranger: !$scope.stranger.name});
      $scope.reported = true;
    };

    $scope.reqFriendship = function () {
      socket.emit('friend:req');
      $scope.friendshipRequested = true;
    };

    $scope.exit = function () {
      $window.location = '/exit';
    };

    socket.on('stranger:res', function (data) {
      //userS.setStranger(data.fullName);
      $scope.setStranger(data);
      titleS.setStranger(data);
      loadingS.trigger();
    });

    socket.on('stranger:disconnected', function (data) {
      $scope.msg.msgs.push({
        text: 'نفر مقابل گفتگو را ترک کرد.',
        from: 'server'
      });
      $scope.stranger.name = '';
      $scope.stranger.commonTopics = [];
      $scope.stranger.otherTopics = [];
      $scope.stranger.gravatarUrl = '';
      $scope.friendshipRequested = false;
      titleS.clear();
    });

    socket.on('friends:update', function (data) {
      $scope.waitingForFriends = false;
      for (var i = 0; i < data.length; i++) {
        if (data[i].gravatarUrl in $scope.friends) {
          $scope.friends[data[i].gravatarUrl].state = data[i].state;
        } else {
          $scope.friends[data[i].gravatarUrl] = data[i];
        }
      }
    });

    socket.on('friend:req', function () {
      alertify.confirm(
        'طرف مقابل برای شما درخواست دوستی فرستاده است.',
        function (res) {
            socket.emit('friend:res', {response: res});
        }
      );
    });

    socket.on('friend:res', function (data) {
      if (data.response === 'acc') {
        alertify.log('هم‌صحبت شما با درخواست دوستی شما موافقت نمود.');
      } else if (data.response === 'dec') {
        alertify.log('هم‌صحبت شما درخواست دوستی شما را نپذیرفت.');
      }
    });

    socket.on('system:error', function (data) {
      $scope.exit();
    });

    socket.on('error', function (data) {
      //notifS.set(
      //  'مشکلی در ارتباط با سرور پیش آمده.',
      //  'err'
      //);
      //$window.location = '/exit';
      if (data === 'handshake error') {
        $window.location = '/exit';
      }
    });

    socket.on('stranger:err', function (data) {
      notifS.set(
        'مشکلی در پیدا کردن فردی برای شما پیش آمده.',
        'err'
      );
    });

    function clearEnv() {
      $scope.setStranger({
        name: '',
        commonTopics: [],
        otherTopics: [],
      });
      titleS.setStranger('');
      $scope.msg.msgs = [];
      $scope.msg.curMsg = '';
      $scope.reported = false;
      $scope.friendshipRequested = false;
    }
  }]).
  controller('MsgCtrl', ['$scope', 'socket', 'userS',
             'notifS', 'titleS', function($scope, socket,
                                          userS, notifS, titleS) {
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
      $scope.msg.msgs.push(data.msg);
      $scope.strangerTyping = false;
      titleS.newMsg();
    });

    socket.on('msg:failed', function (data) {
      notifS.set(
        'پیام ارسال تشد.',
        'err'
      );
    });

    socket.on('msg:strangerTyping', function (data) {
      if (data == 'typing') {
        $scope.strangerTyping = true;
      } else if (data == 'cleared') {
        $scope.strangerTyping = false;
      }
    });
  }]);
