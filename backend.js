
var config = require('./config')
  , rdb = config.rdb
  , rdbLogger = config.rdbLogger
  , io = config.io;

var getSocketById = function (sid) {
  var socket = io.sockets.socket(sid);
  if (!socket || typeof socket === undefined) {
    return false;
  }
  return true;
};

var isOnline = function (userId, cb) {
  rdb.llen('users:sockets:' + userId, function (err, reply) {
    if (err || !reply) {
      logger.err('backend', 'Error in is online');
      logger.err('backend^', err);
    } else {
      cb(reply > 0 ? true : false);
    }
  });
};

var addOnline = function (userId, sid) {
  rdb.lpush('users:sockets:' + userId, sid);
};

var remOnline = function (userId, sid) {
  rdb.lrem('users:sockets:' + userId, '0', sid);
};

module.exports = {
  getSocketById: getSocketById,
  isOnline: isOnline,
  addOnline: addOnline,
  remOnline: remOnline,
};
