/*
 * Serve content over a socket
 */

var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;


module.exports = function (socket) {
  socket.on('stranger:req', function(data) {
    rdb.srandmember('chat:online', function(err, reply) {
      if (err || !reply) {
        socket.emit('stranger:err',
                    {err: 'Something happened when looking up for strangers.'}
                   );
      } else {
        socket.emit('stranger:res', {
          found: true,
          fullName: reply,
        });
      }
    });
    socket.emit('stranger:res', {found: false});
  });

  socket.on('disconnect', function() {
    rdb.srem('chat:online', socket.handshake.session.fullName, rdbLogger);
  });
//  setInterval(function () {
//    socket.emit('send:time', {
//      time: (new Date()).toString()
//    });
//  }, 1000);
};
