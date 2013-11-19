var crypto = require('crypto');

var SaltLength = 9;

function createHash(password) {
  var salt = generateSalt(SaltLength);
  var hash = md5(password + salt);
  return salt + hash;
}

function validateHash(hash, password) {
  var salt = hash.substr(0, SaltLength);
  var validHash = salt + md5(password + salt);
  return hash === validHash;
}

function generateSalt(len) {
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
      setLen = set.length,
      salt = '';
  for (var i = 0; i < len; i++) {
    var p = Math.floor(Math.random() * setLen);
    salt += set[p];
  }
  return salt;
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

var timeDifference = function (first, second) {
  if (!second || typeof second === undefined) {
    second = new Date(Date.now());
  }
  var remaining = new Date(first - second);
  remaining = remaining.getTime();

  var days = Math.floor(remaining / 1000 / 60 / 60 / 24);
  remaining -= days * 1000 * 60 * 60 * 24;

  var hours = Math.floor(remaining / 1000 / 60 / 60);
  remaining -= hours * 1000 * 60 * 60;

  var minutes = Math.floor(remaining / 1000 / 60);
  remaining -= minutes * 1000 * 60;

  var seconds = Math.floor(remaining / 1000);

  var output = '';
  if (days) output = days + 'روز ';
  if (hours) output = output + hours + 'ساعت ';
  if (minutes) output = output + minutes + 'دقیقه ';
  if (seconds) output = output + seconds + 'ثانیه';

  return output;
}

module.exports = {
  createHash: createHash,
  validateHash: validateHash,
  md5: md5,
  timeDifference: timeDifference,
};
