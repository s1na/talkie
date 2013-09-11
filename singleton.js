var express = require('express');
var Session = express.session.Session;

exports.SessionSingleton = (function SessionSingleton() {
  var instance;

  var getInstance = function () {
    if (typeof instance === 'undefined') {
      instance = (function () {
        var sessionWrappers = {};

        function SessionWrapper(hs, session_) {
          var session = new Session(hs, session_);

          /*var getWrapper = function (hs, session_) {
            if (typeof session === 'undefined') {
              session = new Session(hs, session_);
            }
            return session
          };*/

          var existsSession = function () {
            return (typeof session !== 'undefined');
          };

          var getS = function () {
            return session;
          };

          var destroy = function (fn) {
            if (existsSession()) {
              delete sessionWrappers[session.id];
              session.destroy();
              session = undefined;
            }
          };

          var save = function () {
            if (existsSession()) {
              session.save();
            }
          };

          var reload = function () {
            if (existsSession()) {
              session.reload();
            }
          };

          var touch = function () {
            if (existsSession()) {
              session.touch();
            }
          };

          return {
            //getWrapper: getWrapper,
            destroy: destroy,
            s: getS,
            save: save,
            reload: reload,
            touch: touch
          };
        }

        var init = function (hs, session) {
          return new SessionWrapper(hs, session);
        }

        var getSession = function (hs, session) {
          if (typeof sessionWrappers[hs.sessionID] === 'undefined') {
            var sessionWrapper = init(hs, session);
            sessionWrappers[hs.sessionID] = sessionWrapper;
            return sessionWrapper;
          } else {
            console.log(
              '[SessionSingleton] Session already available, ' +
              hs.sessionID
            );
            return sessionWrappers[hs.sessionID];
          }
        };

        var getSessionWrapper = function (sid) {
          return sessionWrappers[sid];
        };

        return {
          getSession: getSession,
          getSessionWrapper: getSessionWrapper
        };
      })();
    }
    return instance;
  };

  return {
    getInstance: getInstance
  };
})();
