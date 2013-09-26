var config = require('./config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;

module.exports = function statistics() {
  return function (req, res, next) {
    var ip = '';
    if (req.headers['x-nginx-proxy'] == 'true') {
      ip = req.headers['x-real-ip'];
    } else {
      ip = req.connection.remoteAddress;
    }
    rdb.sismember(
      'stats:ip',
      ip,
      function (err, reply) {
        if (err || typeof reply === 'undefined') {
          console.log('[Statistics] No reply from redis.');
        } else {
          if (!reply) {
            rdb.sadd('stats:ip', ip, rdbLogger);
            rdb.incr('stats:visit:total', rdbLogger);
          }
        }
      }
    );
    rdb.incr('stats:hit:total', rdbLogger);
    next();
  };
}
