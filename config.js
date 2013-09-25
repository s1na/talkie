var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//var SocketRedisStore = require('socket.io/lib/stores/redis');
var redis = require('redis');
/*var pub = redis.createClient();
var sub = redis.createClient();
var client = redis.createClient();*/
var rdb = redis.createClient();
var RedisStore = require('connect-redis')(express);

var secretKey = 'This4is$highly4secure.';
var sessionPrefix = 'sess:';
var sessionExpiration = 1000 * 60 * 60 * 24 * 2;
var parseCookie = express.cookieParser(secretKey);
var sessionSingleton = require('./singleton').SessionSingleton.getInstance();

// Redis and session configuration
rdb.select(3, redis.print);
/*pub.select(3, redis.print);
sub.select(3, redis.print);
client.select(3, redis.print);*/

rdb.on('error', function (err) {
  console.log('[Redis](Error) ' + err);
});

var redisStore = new RedisStore({
  client: rdb
});

function rdbLogger(err, res) {
  process.stdout.write('[Redis] ');
  redis.print(err, res);
}

// Websocket authorization
io.set('log level', 2);
io.configure('production', function () {
  io.set('transports', [
    'websocket',
    'htmlfile',
    'xhr-polling',
    'jsonp-polling'
  ]);
  io.enable('browser client minification', true);
  io.enable('browser client etag', true);
  io.enable('browser client gzip', true);
  /*io.set('store', new SocketRedisStore({
    redisPub: pub,
    redisSub: sub,
    redisClient: client
  }));*/
});
io.set('polling duration', 3);
io.set('authorization', function (hs, accept) {
  if (hs.headers.cookie) {
    var sessionID;
    parseCookie(hs, null, function (data) {
      sessionID = hs.signedCookies['connect.sid'];
    });
    hs.sessionStore = redisStore;
    if (!sessionID) {
      accept('[Handshake] has no socket.', false);
    }
    hs.sessionID = sessionID;
    redisStore.get(sessionID, function (err, session) {
      if (err || !session) {
        console.log('Handshake error, ' + session + ', ' + err);
        accept('Error while handshaking.', false);
      } else {
        hs.sw = new sessionSingleton.getSession(hs, session);
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie found', false);
  }
});

// Exports
module.exports.express = express;
module.exports.app = app;
module.exports.server = server;
module.exports.io = io;
module.exports.rdb = rdb;
module.exports.rdbLogger = rdbLogger;
module.exports.redisStore = redisStore;
module.exports.secretKey = secretKey;
module.exports.sessionExpiration = sessionExpiration;
module.exports.parseCookie = parseCookie;
