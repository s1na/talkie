/* jshint globalstrict: true */
"use strict";

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('talkie.services', []).
  service('userS', ['$http', '$q', function ($http, $q) {
    var user;
    this.stranger = {
      name: '',
      commonTopics: [],
      otherTopics: [],
    };

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

    this.setStranger = function (name, commonTopics, otherTopics) {
      this.stranger.name = name;
      this.stranger.commonTopics = commonTopics;
      this.stranger.otherTopics = otherTopics;
    };
  }]).
  service('msgS', function () {
    this.msgs = [];
    this.curMsg = '';
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
  }).
  service('titleS', function () {
    this.defaultTitle = 'هورین';
    this.title = this.defaultTitle;
    this.unseenMsgs = 0;

    this.setStranger = function (stranger) {
      if (!stranger.name) {
        this.title = this.defaultTitle;
      } else {
        this.removeUnseenMsgs();
        this.title = this.title + ' - ' + stranger.name;
      }
    };

    this.newMsg = function () {
      if (!document.hasFocus()) {
        this.unseenMsgs++;
        if (this.title[this.title.length - 1] === ')') {
          this.removeUnseenMsgs();
        }
        this.addUnseenMsgs();
      }
    };

    this.removeUnseenMsgs = function () {
      if (this.title.indexOf('(') !== -1) {
        this.title = this.title.slice(
          0, this.title.indexOf('(')
        );
      }
    };

    this.addUnseenMsgs = function () {
      this.title = this.title + ' (' + this.unseenMsgs + ')';
    };

    this.clear = function () {
      this.title = this.defaultTitle;
    };
  });
