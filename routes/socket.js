/*
 * Serve content over a socket
 */

var config = require('../config');


module.exports = function (socket) {
  socket.on('stranger:req', function(data) {
    socket.emit('stranger:res', {found: false});
  });

  socket.on('disconnect', function() {
  });
//  setInterval(function () {
//    socket.emit('send:time', {
//      time: (new Date()).toString()
//    });
//  }, 1000);
};
