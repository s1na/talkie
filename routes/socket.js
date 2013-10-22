/*
 * Serve content over a socket
 */

var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;
var io = config.io;
var maxReports = config.maxReports;
var banExpiration = config.banExpiration;

var db = require('../db');
var Reported = db.Reported;

var logger = require('../logger');

module.exports = function (socket) {

  // Add socket to session
  if (!isSocketValid(socket)) {
    emitError(socket);
    return;
  }

  rdb.sadd('chat:online', socket.id, rdbLogger);
  logger.info('socket',
              'New socket, ' + socket.id + ' '
             );

  // Looking for a new stranger.
  socket.on('stranger:req', function (data) {
    logger.info('socket',
                'Socket requested, ' + socket.id + ' '
               );

    if (!isSocketValid(socket)) {
      emitError(socket);
      return;
    }
    if (authenticate(socket)) {
      if (isActive(socket.handshake.sw.s())) {
        var res;
        rdb.srandmember('chat:waiting', function (err, reply) {
          if (err) {
            socket.emit('stranger:err',
                        {err: 'Something happened when looking up for strangers.'}
                       );
          } else if (!reply) {
            res = getStrangerSocket(socket);

            if (res.ok) {
              res.strangerSocket.set('strangerSID', '');
              res.strangerSocket.set('lastStrangerIp', socket.handshake.sw.s().ip);
              socket.set('strangerSID', '');
              res.strangerSocket.emit('stranger:disconnected');
            }

            rdb.sadd('chat:waiting', socket.id);
          } else {
            res = getStrangerSocket(socket);

            if (res.ok) {
              res.strangerSocket.set('strangerSID', '');
              res.strangerSocket.set('lastStrangerIp', socket.handshake.sw.s().ip);
              socket.set('strangerSID', '');
              res.strangerSocket.emit('stranger:disconnected');
            }

            rdb.srem('chat:waiting', reply);
            logger.info('socket', 'Stranger found, ' + reply);

            strangerSocket = io.sockets.socket(reply);
            if (isSocketValid(strangerSocket)) {
              if (!isSocketValid(socket)) {
                emitError(socket);
                return;
              }
              socket.set('strangerSID', reply);
              strangerSocket.set('strangerSID', socket.id);

              socket.handshake.sw.s().chatCount += 1;
              socket.handshake.sw.save();
              strangerSocket.handshake.sw.s().chatCount += 1;
              strangerSocket.handshake.sw.save();

              socket.emit('stranger:res', {
                fullName: strangerSocket.handshake.sw.s().fullName,
              });

              strangerSocket.emit('stranger:res', {
                fullName: socket.handshake.sw.s().fullName,
              });
            } else {
              if (typeof strangerSocket.id !== 'undefined') {
                rdb.srem('chat:online', strangerSocket.id, rdbLogger);
                strangerSocket.disconnect('Weird Socket');
              }
              rdb.sadd('chat:waiting', socket.id);
              logger.err('socket', 'Found stranger has no handshake. Still looking.');
              //logger.err('socket', strangerSocket);
            }
          }
        });
      } else {
        socket.handshake.sw.destroy();
        emitError(socket);
      }
    }
  });

  socket.on('stranger:report', function (data) {
    if (authenticate(socket)) {
      if (data.noStranger) {
        socket.get('lastStrangerIp', function (err, ip) {
          if (err || !ip) {
            logger.err('socket', 'No last stranger available.');
            if (err) logger.err('socket', err);
          } else {
            Reported.findOne({ip: ip}, function (err, reported) {
              if (err) {
                logger.err('socket', 'in reporting: ' + err);
              } else if (!reported){
                var reported = new Reported({ip: ip});
                reported.reporters.push(socket.handshake.sw.s().ip);
                reported.save(function (err, reported) {
                  if (err) {
                    logger.err('socket', 'Error in saving report: ' + err);
                  }
                });
              } else {
                if (reported.reporters.indexOf(socket.handshake.sw.s().ip) === -1) {
                  if (reported.reporters.length >= maxReports - 1) {
                    Banned.findOne({ip: ip}, function (err, banned) {
                      if (err) {
                      } else if (!banned) {
                        var banned = new Banned(
                          {ip: ip, expires: new Date(Date.now() + banExpiration)}
                        );
                        banned.save(function (err, banned) {
                          if (err) {
                            logger.err('socket', 'Error in saving a banned user.');
                          }
                        });
                        reported.remove(function (err) {
                          if (err) {
                            logger.err('socket', 'Error in removing the reported person after ban.');
                          }
                        });
                        //socket.handshake.sw.destroy();
                        //emitError(socket);
                      } else {
                      }
                    });
                  } else {
                    reported.update(
                      {$push: {reporters: ip}},
                      function (err, reported) {
                        if (err) {
                          logger.err('socket', 'Could not add reporter ip.');
                        }
                      }
                    );
                  }
                }
              }
           });
          }
        });
      } else {
        var res = getStrangerSocket(socket);

        if (res.ok) {
          if (res.strangerSocket.handshake.sw.s().ip) {
            var ip = res.strangerSocket.handshake.sw.s().ip;
            Reported.findOne({ip: ip}, function (err, reported) {
              if (err) {
                logger.err('socket', "in reporting: " + err);
              } else if (!reported) {
                var reported = new Reported({
                  ip: ip
                });
                reported.reporters.push(socket.handshake.sw.s().ip);
                reported.save(function (err, reported) {
                  if (err) {
                    logger.err('socket', 'Error while saving report: ' + err);
                  }
                });
              } else {
                if (reported.reporters.indexOf(socket.handshake.sw.s().ip) === -1) {
                  if (reported.reporters.length >= maxReports - 1) {
                    Banned.findOne({ip: ip}, function (err, banned) {
                      if (err) {
                      } else if (!banned) {
                        var banned = new Banned(
                          {ip: ip, expires: new Date(Date.now() + banExpiration)}
                        );
                        banned.save(function (err, banned) {
                          if (err) {
                            logger.err('socket', 'Error in saving a banned user.');
                          }
                        });
                        reported.remove(function (err) {
                          if (err) {
                            logger.err('socket', 'Error in removing the reported person after ban.');
                          }
                        });
                        res.strangerSocket.handshake.sw.destroy();
                        res.strangerSocket.emit('system:error');
                      } else {
                      }
                    });
                  } else {
                    reported.update(
                      {$push: {reporters: ip}},
                      function (err, reported) {
                        if (err) {
                          logger.err('socket', 'Could not add reporter ip.');
                        }
                      }
                    );
                  }
                }
              }
           });
          } else {
            logger.err('socket', 'stranger socket has no ip for report.');
          }
        } else {
          logger.err('socket', 'Getting stranger socket for report failed.');
        }
      }
    } else {
      socket.handshake.sw.destroy();
      emitError(socket);
    }
  });

  // New message to be sent
  socket.on('msg:send', function (data) {
    if (authenticate(socket)) {
      var msg = '';
      if (typeof data.msg === 'string') {
        msg = data.msg;
      } else {
        logger.err('socket',
                   'Message being sent is not string.'
                  );
        logger.err('socket',
                   String(data.msg)
                  );

        if (typeof data.msg.text === 'string') {
          msg = data.msg.text;
        }
      }
      if (msg.trim()) {
        socket.handshake.sw.s().msgCount += 1;
        socket.handshake.sw.save();
        var res = getStrangerSocket(socket);

        if (res.ok) {
          msg = {text: msg};
          msg.from = 'stranger';
          res.strangerSocket.emit('msg:recv', {msg: msg});
        }
      } else {
        logger.err('socket',
                   'Message was not sent. ' + msg
                  )
        socket.emit('msg:failed');
      }
    }
  });

  // Typing status
  socket.on('msg:typing', function (data) {
    if (authenticate(socket)) {
      var res = getStrangerSocket(socket);

      if (res.ok) {
        res.strangerSocket.emit('msg:strangerTyping', data);
      }
    }
  });

  // Socket disconnected.
  socket.on('disconnect', function () {
    logger.info('socket', 'Socket disconnected, ' + socket.id);
    rdb.srem('chat:online', socket.id, rdbLogger);
    rdb.srem('chat:waiting', socket.id, rdbLogger);
    var res = getStrangerSocket(socket);

    if (res.ok) {
      logger.info('socket', 'Stranger disconnected, ' + res.strangerSocket.id);
      res.strangerSocket.set('strangerSID', '');
      // TODO: Somehow keep their ips even if their session is destroyed.
      if (typeof socket.handshake.sw !== 'undefined') {
        if (typeof socket.handshake.sw.s() !== 'undefined') {
          res.strangerSocket.set('lastStrangerIp', socket.handshake.sw.s().ip);
        }
      }
      socket.set('strangerSID', '');
      res.strangerSocket.emit('stranger:disconnected');
    }
  });

//  setInterval(function () {
//    socket.emit('send:time', {
//      time: (new Date()).toString()
//    });
//  }, 1000);
};

function getStrangerSocket(socket) {
  var ok = true;
  var strangerSocket = null;

  socket.get('strangerSID', function (err, sid) {
    if (err || !sid) {
      socket.emit('msg:err');
      ok = false;
    } else {
      strangerSocket = io.sockets.socket(sid);
    }
  });

  if (!isSocketValid(strangerSocket)) {
    ok = false;
    if (strangerSocket) {
      strangerSocket.emit('system:error');
    }
  }
  return {ok: ok, strangerSocket: strangerSocket};
}

function isActive(session) {
  return true;
  /*if (session.msgCount === 0 && session.chatCount >= 3) {
    logger.err('socket', 'User is not active.');
    return false;
  }
  return true;*/
}

function authenticate(socket) {
  if (typeof socket.handshake.sw.s() !== 'undefined') {
    if (socket.handshake.sw.s().loggedIn) {
      return true;
    }
  }
  logger.info('socket', 'Socket not authenticated.');
  //logger.err('socket', socket.handshake.sw.s());
  //emitError(socket);
  return false;
}

function emitError(socket) {
  if (typeof socket !== 'undefined') {
    if (typeof socket.handshake !== 'undefined') {
      if (typeof socket.handshake.sw !== 'undefined') {
        if (typeof socket.handshake.sw.s() !== 'undefined') {
          logger.err('socket', 'Emitting error for socket.');
          logger.err('socket', socket.handshake.sw.s());
        } else {
          logger.err('socket', 'Socket has no session.');
          //logger.err('socket', socket.handshake);
        }
      } else {
        logger.err('socket', 'Socket handshake has no session wrapper.');
        logger.err('socket', socket.handshake);
      }
    } else {
      logger.err('socket', 'Socket has no handshake data.');
      //logger.err('socket', socket);
    }
    socket.emit('system:error');
  } else {
    logger.err('socket', 'User has no socket to emit error, weird!');
  }
}

function isSocketValid(socket) {
  if (typeof socket !== 'undefined' && socket !== null) {
    if (typeof socket.handshake !== 'undefined') {
      if (typeof socket.handshake.sw !== 'undefined') {
        if (typeof socket.handshake.sw.s() !== 'undefined') {
          return true;
        }
      }
    }
  }

  return false;
}

/*
function updateParallelSessions(socket) {
  var errorHandler = function (err) {
    if (err) {
      console.log('Error in parallel update session.');
    }
  };
  if (! socket.handshake.session) {
    errorHandler(true);
  }
  var parallelSocket;
  for (var sidIndex in socket.handshake.session.sockets) {
    if (socket.handshake.session.sockets[sidIndex] !== socket.id) {
      parallelSocket = io.sockets.socket(
        socket.handshake.session.sockets[sidIndex]
      );
      if (parallelSocket) {
        if (typeof parallelSocket.handshake === 'undefined') {
          errorHandler(true);
        } else if (typeof parallelSocket.handshake.session === 'undefined') {
          errorHandler(true);
        } else {
          parallelSocket.handshake.session.reload(errorHandler);
        }
      } else {
        errorHandler(true);
      }
    }
  }
}*/
