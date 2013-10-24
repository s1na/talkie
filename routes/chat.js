
var config = require('../config');

module.exports.chat = function(req, res) {
  req.session.cookie.maxAge = config.memberSessionExpiration;
  res.render('chat', {development: req.development});
};
