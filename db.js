var redis = require('redis');
var rdb = redis.createClient();

rdb.select(3, redis.print);
rdb.on('error', function(err) {
  console.log('[Redis](Error) ' + err);
});

function rdbLogger(err, res) {
  process.stdout.write('[Redis] ');
  redis.print(err, res);
}

module.exports.rdb = rdb;
module.exports.rdbLogger = rdbLogger;
