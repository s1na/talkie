
var config = require('../config');
var rdb = config.rdb;
var rdbLogger = config.rdbLogger;

exports.index = function(req, res) {
  if (req.session.loggedIn) {
    req.session.touch();
    res.redirect('/chat');
  }
  res.render('index');
};

exports.partials = function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

exports.auth = function(req, res) {
  if (req.session.loggedIn) {
    rdb.sadd('chat:online', req.session.fullName, rdbLogger);
    res.redirect('/chat');
  }

  var fullName = req.body.fullName;
  req.session.fullName = fullName;
  req.session.loggedIn = true;
  req.session.save();
  res.redirect('/chat');
};

exports.exit = function(req, res) {
  req.session.destroy();
  res.redirect('/');
};
