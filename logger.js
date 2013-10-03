var stringify = require('json-stringify-safe');

module.exports.info = function (from, msg) {
  setTimeout(function () {
    log('info', from, msg);
  }, 1);
};

module.exports.err = function (from, msg) {
  setTimeout(function () {
    log('err', from, msg);
  }, 1);
};

function log(type, from, msg) {
  var now = new Date(Date.now());
  now = now.getFullYear() + '/' + now.getMonth() + '/' + now.getDate() +
    ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  if (typeof from === 'undefined') {
    from = ''
  } else {
    from = '[' + from[0].toUpperCase() + from.slice(1) + ']';
  }

  if (typeof msg === 'object') {
    msg = stringify(msg);
  }

  if (type == 'info') {
    console.log(now + ' ' + from + ' ' + msg);
  } else if (type == 'err') {
    console.error(now + ' ' + from + ' ' + msg);
  }
}
