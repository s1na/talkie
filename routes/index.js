
var db = require('../db');
var rdb = db.rdb;
var rdbLogger = db.rdbLogger;

exports.index = function(req, res) {
  res.render('index');
  rdb.set('test:test', 'sina', rdbLogger);
  rdb.get('test:test', function(err, res) {
    if (!err) {
      console.log(res);
    }
  });
};

exports.partials = function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

exports.auth = function(req, res) {
  var nickname = req.body.nickname;
  req.session.loggedIn = true;
  req.session.nickname = nickname;
  res.redirect('/chat');
}
