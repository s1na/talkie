/*
 * Serve content over a socket
 */

var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;
var io = config.io;


module.exports = function (socket) {

  // Add socket to session
  if (typeof socket.handshake.sw === 'undefined') {
    socket.emit('error');
    return;
  } else if (typeof socket.handshake.sw.s() === 'undefined') {
    socket.emit('error');
    return;
  }// else {
    /*socket.handshake.session.sockets.push(socket.id);
    socket.handshake.session.save();
  }*/
  rdb.sadd('chat:online', socket.id, rdbLogger);
  console.log(
    'New socket, ' + socket.id + ' ' +
    JSON.stringify(socket.handshake.sw.s())
  );

  // Looking for a new stranger.
  socket.on('stranger:req', function (data) {
    console.log(
      'Socket requested, ' + socket.id + ' ' +
      JSON.stringify(socket.handshake.sw.s())
    );

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
              res.strangerSocket.emit('stranger:disconnected');
              res.strangerSocket.set('strangerSID', '');
            }

            rdb.sadd('chat:waiting', socket.id);
            // TODO: setInterval(); or node events
          } else {
            res = getStrangerSocket(socket);

            if (res.ok) {
              res.strangerSocket.emit('stranger:disconnected');
              res.strangerSocket.set('strangerSID', '');
            }

            console.log('stranger found, ' + reply);
            rdb.srem('chat:waiting', reply);

            strangerSocket = io.sockets.socket(reply);
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
          }
        });
        //socket.emit('stranger:res', {found: false});
      } else {
        socket.handshake.sw.destroy();
        socket.emit('error');
      }
    }
  });

  // New message to be sent
  socket.on('msg:send', function (data) {
    if (authenticate(socket)) {
      socket.handshake.sw.s().msgCount += 1;
      socket.handshake.sw.save();
      var res = getStrangerSocket(socket);

      if (res.ok) {
        data.msg = {text: data.msg};
        data.msg.from = 'stranger';
        res.strangerSocket.emit('msg:recv', {msg: data.msg});
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
    console.log('Socket disconnected, ' + socket.id);
    rdb.srem('chat:online', socket.id, rdbLogger);
    rdb.srem('chat:waiting', socket.id, rdbLogger);
    if (typeof socket.handshake.sw.s() !== 'undefined') {
      /*socket.handshake.session.sockets.splice(
        socket.handshake.session.sockets.indexOf(socket.id), 1);
      socket.handshake.session.save();*/
    }
    var res = getStrangerSocket(socket);

    if (res.ok) {
      res.strangerSocket.emit('stranger:disconnected');
      res.strangerSocket.set('strangerSID', '');
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

  return {ok: ok, strangerSocket: strangerSocket};
}

function isActive(session) {
  if (session.msgCount === 0 && session.chatCount >= 3) {
    return false;
  }
  return true;
}

function authenticate(socket) {
  if (typeof socket.handshake.sw.s() !== 'undefined') {
    if (socket.handshake.sw.s().loggedIn) {
      return true;
    }
  }
  socket.emit('error');
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
