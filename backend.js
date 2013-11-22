
var config = require('./config')
  , rdb = config.rdb
  , rdbLogger = config.rdbLogger
  , io = config.io
  , logger = require('./logger');

var getSocketById = function (sid) {
  var socket = io.sockets.socket(sid);
  if (!socket || typeof socket === undefined) {
    return false;
  }
  return true;
};

var isOnline = function (user, cb) {
  rdb.lrange('users:sockets:' + user.id, 0, -1, function (err, replies) {
    if (err) {
      logger.err('backend', 'Error in is online');
      logger.err('backend^', err);
      cb(false, null);
    } else {
      if (replies.length === 0) {
        cb(false, null);
      } else {
        cb(true, replies);
      }
    }
  });
};

var addOnline = function (user, socket) {
  rdb.lpush('users:sockets:' + user.id, socket.id);

  user.getFriends(function (err, results) {
    if (err) {
      logger.err('backend', 'Error in getting friends.');
      logger.err('backend^', err);
    } else {
      var friends = [];
      for (var i = 0; i < results.length; i++) {
        var is_last = i === results.length - 1;
        (function (user, friend, friends, is_last) {
          isOnline(friend, function (online, sockets) {
            if (online) {
              friends.push({
                name: friend.username,
                gravatarUrl: friend.gravatarUrl,
                state: 'online'
              });
              var friendSocket;
              for (var j = 0; j < sockets.length; j++) {
                friendSocket = io.sockets.socket(sockets[j]);
                friendSocket.emit('friends:update', [{
                  name: user.username,
                  gravatarUrl: user.gravatarUrl,
                  state: 'online',
                }]);
              }
            } else {
              friends.push({
                name: friend.username,
                gravatarUrl: friend.gravatarUrl,
                state: 'offline'
              });
            }
            if (is_last) {
              socket.emit('friends:update', friends);
            }
          });
        })(user, results[i], friends, is_last);
      }
    }
  });
};

var remOnline = function (user, sid) {
  if (sid === 'all') {
    rdb.del('users:sockets:' + user.id);
  } else {
    rdb.lrem('users:sockets:' + user.id, '0', sid);
  }

  user.getFriends(function (err, results) {
    if (err) {
      logger.err('backend', 'Error in getting friends.');
      logger.err('backend^', err);
    } else {
      for (var i = 0; i < results.length; i++) {
        (function (user, friend) {
          isOnline(friend, function (online, sockets) {
            if (online) {
              var friendSocket;
              for (var j = 0; j < sockets.length; j++) {
                friendSocket = io.sockets.socket(sockets[j]);
                friendSocket.emit('friends:update', [{
                  name: user.username,
                  gravatarUrl: user.gravatarUrl,
                  state: 'offline',
                }]);
              }
            }
          });
        })(user, results[i]);
      }
    }
  });
};

module.exports = {
  getSocketById: getSocketById,
  isOnline: isOnline,
  addOnline: addOnline,
  remOnline: remOnline,
};
