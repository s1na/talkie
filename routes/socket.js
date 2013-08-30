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

  // Looking for a new stranger.
  socket.on('stranger:req', function (data) {
    console.log('Socket requested, ' + socket.id);
    rdb.srandmember('chat:waiting', function (err, reply) {
      if (err) {
        socket.emit('stranger:err',
                    {err: 'Something happened when looking up for strangers.'}
                   );
      } else if (!reply) {
        rdb.sadd('chat:waiting', socket.id);
        // TODO: setInterval(); or node events
      } else{
        console.log('stranger found, ' + reply);
        rdb.srem('chat:waiting', reply);

        strangerSocket = io.sockets.socket(reply);
        socket.set('strangerSID', reply);
        strangerSocket.set('strangerSID', socket.id);

        socket.emit('stranger:res', {
          fullName: strangerSocket.handshake.session.fullName,
        });

        strangerSocket.emit('stranger:res', {
          fullName: socket.handshake.session.fullName,
        });
      }
    });
    //socket.emit('stranger:res', {found: false});
  });

  // New message to be sent
  socket.on('msg:send', function (data) {
    var strangerSocket = null;
    socket.get('strangerSID', function(err, sid) {
      if (err || !sid) {
        socket.emit('msg:err');
      } else {
        strangerSocket = io.sockets.socket(sid);
      }
    });
    strangerSocket.emit('msg:recv', {msg: data.msg});
  });

  // Socket disconnected.
  socket.on('disconnect', function () {
    console.log('Socket disconnected, ' + socket.id);
    rdb.srem('chat:online', socket.id, rdbLogger);
    rdb.srem('chat:waiting', socket.id, rdbLogger);
  });

//  setInterval(function () {
//    socket.emit('send:time', {
//      time: (new Date()).toString()
//    });
//  }, 1000);
};
