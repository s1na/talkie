module.exports = function statistics() {
  return function (req, res, next) {
    console.log('Remote address: ' + req.connection.remoteAddress + '  ' + req.path );
    next();
  };
}
