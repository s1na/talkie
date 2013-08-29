
var db = require('../db');
var rdb = db.rdb;
var rdbLogger = db.rdbLogger;

exports.index = function(req, res) {
  console.log(req.session);
  req.session.nickname = 's1na';
  if (req.session.loggedIn) {
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
    res.redirect('/chat');
  }

  var nickname = req.body.nickname;
  req.session.nickname = nickname;
  req.session.loggedIn = true;
  req.session.save();
  console.log(req.session);
  res.redirect('/chat');
};

exports.exit = function(req, res) {
  req.session.destroy();
  res.redirect('/');
}
