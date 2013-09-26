var config = require('./config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;

module.exports = function statistics() {
  return function (req, res, next) {
    rdb.sismember(
      'stats:ip',
      req.connection.remoteAddress,
      function (err, reply) {
        if (err || typeof reply === 'undefined') {
          console.log('[Statistics] No reply from redis.');
        } else {
          if (!reply) {
            rdb.sadd('stats:ip', req.connection.remoteAddress, rdbLogger);
            rdb.incr('stats:visit:total', rdbLogger);
          }
        }
      }
    );
    rdb.incr('stats:hit:total', rdbLogger);
    next();
  };
}
