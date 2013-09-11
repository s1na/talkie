
var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;
var io = config.io;
var sessionSingleton = require('../singleton').SessionSingleton.getInstance();

exports.index = function(req, res) {
  if (req.session.loggedIn) {
    req.session.touch();
    res.redirect('/chat');
  }
  res.render('index', {development: req.development});
};

exports.partials = function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

exports.auth = function(req, res) {
  if (req.session.loggedIn) {
    res.redirect('/chat');
  }

  var fullName = req.body.fullName;
  req.session.fullName = fullName;
  req.session.msgCount = 0;
  req.session.chatCount = 0;
  req.session.loggedIn = true;
  req.session.save();
  res.redirect('/chat');
};

exports.exit = function(req, res) {
  if (typeof req.session !== 'undefined') {
    var sw = sessionSingleton.getSessionWrapper(req.session.id);
    if (typeof sw !== 'undefined') {
      sw.destroy();
    }
    req.session.destroy();
  }
  res.redirect('/');
};

module.exports.about = function(req, res) {
  res.render('about');
};

module.exports.rules = function(req, res) {
  res.render('rules');
};
