
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
                name: friend.name,
                gravatarUrl: friend.gravatarUrl,
                state: 'online'
              });
              var friendSocket;
              for (var j = 0; j < sockets.length; j++) {
                friendSocket = io.sockets.socket(sockets[j]);
                friendSocket.emit('friends:update', [{
                  name: user.name,
                  gravatarUrl: user.gravatarUrl,
                  state: 'online',
                }]);
              }
            } else {
              friends.push({
                name: friend.name,
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
  isOnline(user, function (online, sockets) {
    if (online) {
      if (sid === 'all') {
        var socket;
        for (var i = 0; i < sockets.length; i++) {
          socket = io.sockets.socket(sockets[i]);
          socket.emit('system:error');
        }
        rdb.del('users:sockets:' + user.id);
      } else {
        rdb.lrem('users:sockets:' + user.id, '0', sid);
        if (sockets.length < 2) {
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
                          name: user.name,
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
        }

      }
    }
  });
};

var updateFriends = function (user, data) {
  isOnline(user, function (online, sockets) {
    if (online) {
      var friendSocket;
      for (var i = 0; i < sockets.length; i++) {
        friendSocket = io.sockets.socket(sockets[i]);
        friendSocket.emit('friends:update', data);
      }
    }
  });
};

var addFriendUpdate = function (firstUser, secondUser) {
  var ok = firstUser.addFriend(secondUser.id);
  if (ok) {
    ok = secondUser.addFriend(firstUser.id);
    if (ok) {
      updateFriends(firstUser, [{
        name: secondUser.name,
        gravatarUrl: secondUser.gravatarUrl,
        state: 'online',
      }]);

      updateFriends(secondUser, [{
        name: firstUser.name,
        gravatarUrl: firstUser.gravatarUrl,
        state: 'online'
      }]);
    } else {
      firstUser.remFriend(secondUser.id);
    }
  }
};

module.exports = {
  getSocketById: getSocketById,
  isOnline: isOnline,
  addOnline: addOnline,
  remOnline: remOnline,
  addFriendUpdate: addFriendUpdate,
};
