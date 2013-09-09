/*
 * Serve content over a socket
 */

var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;
var io = config.io;


module.exports = function (socket) {
  rdb.sadd('chat:online', socket.id, rdbLogger);
  console.log('New socket, ' + socket.id);

  // Add socket to session
  socket.handshake.session.socket.push(socket.id);
  socket.handshake.session.save();
  updateParallelSessions(socket);

  // Looking for a new stranger.
  socket.on('stranger:req', function (data) {
    console.log('Socket requested, ' + socket.id);

    if (authenticate(socket)) {
      if (isActive(socket.handshake.session)) {
        var res;
        rdb.srandmember('chat:waiting', function (err, reply) {
          if (err) {
            socket.emit('stranger:err',
                        {err: 'Something happened when looking up for strangers.'}
                       );
          } else if (!reply) {
            res = getStrangerSocket(socket);

            if (res.ok) {
              console.log('found stranger');
              res.strangerSocket.emit('stranger:disconnected');
              res.strangerSocket.set('strangerSID', '');
            }

            rdb.sadd('chat:waiting', socket.id);
            // TODO: setInterval(); or node events
          } else {
            res = getStrangerSocket(socket);

            if (res.ok) {
              console.log('fount stranger');
              res.strangerSocket.emit('stranger:disconnected');
              res.strangerSocket.set('strangerSID', '');
            }

            console.log('stranger found, ' + reply);
            rdb.srem('chat:waiting', reply);

            strangerSocket = io.sockets.socket(reply);
            socket.set('strangerSID', reply);
            strangerSocket.set('strangerSID', socket.id);

            socket.handshake.session.chatCount += 1;
            socket.handshake.session.save();
            updateParallelSessions(socket);
            strangerSocket.handshake.session.chatCount += 1;
            strangerSocket.handshake.session.save();
            updateParallelSessions(strangerSocket);

            socket.emit('stranger:res', {
              fullName: strangerSocket.handshake.session.fullName,
            });

            strangerSocket.emit('stranger:res', {
              fullName: socket.handshake.session.fullName,
            });
          }
        });
        //socket.emit('stranger:res', {found: false});
      } else {
        socket.handshake.session.destroy();
        socket.emit('server:logout');
      }
    }
  });

  // New message to be sent
  socket.on('msg:send', function (data) {
    if (authenticate(socket)) {
      socket.handshake.session.msgCount += 1;
      socket.handshake.session.save();
      updateParallelSessions(socket);
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
    if (typeof socket.handshake.session !== 'undefined') {
      socket.handshake.session.socket.splice(
        socket.handshake.session.socket.indexOf(socket.id), 1);
      socket.handshake.session.save();
      updateParallelSessions(socket);
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
  if (typeof socket.handshake.session !== 'undefined') {
    if (socket.handshake.session.loggedIn) {
      return true;
    }
  }
  socket.emit('server:logout');
  return false;
}

function updateParallelSessions(socket) {
  var errorHandler = function (err) {
    if (err) {
      console.log('Error in parallel update session.');
    }
  };
  for (var sidIndex in socket.handshake.session.socket) {
    if (socket.handshake.session.socket[sidIndex] !== socket.id) {
      io.sockets.socket(
        socket.handshake.session.socket[sidIndex]
      ).handshake.session.reload(errorHandler);
    }
  }
}
