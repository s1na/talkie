var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis');
var rdb = redis.createClient();
var Session = express.session.Session;
var RedisStore = require('connect-redis')(express);

var secretKey = 'This4is$highly4secure.';
var sessionPrefix = 'sess:';
var parseCookie = express.cookieParser(secretKey);

// Redis and session configuration
rdb.select(3, redis.print);
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
io.configure(function () {
  io.set('polling duration', 0.5);
});
io.set('authorization', function (hs, accept) {
  if (hs.headers.cookie) {
    var sessionID;
    parseCookie(hs, null, function (data) {
      sessionID = hs.signedCookies['connect.sid'];
    });
    hs.sessionStore = redisStore;
    hs.sessionID = sessionID;
    redisStore.get(sessionID, function (err, session) {
      if (err || !session) {
        console.log('Handshake error, ' + session + ', ' + err);
        accept('Error while handshaking.', false);
      } else {
        hs.session = new Session(hs, session);
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
module.exports.parseCookie = parseCookie;
