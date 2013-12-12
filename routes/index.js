
var config = require('../config');
/*var rdb = config.rdb;
var rdbLogger = config.rdbLogger;
var io = config.io;*/
var sessionSingleton = require('../singleton').SessionSingleton.getInstance();
var sessionExpiration = config.sessionExpiration;
var logger = require('../logger');
var sendMail = require('../email').sendMail;

//var db = require('../db');
//var User = db.User;

exports.index = function (req, res) {
  if (req.user) {
    req.session.cookie.maxAge = config.memberSessionExpiration;
    req.session.save();
    if (req.user.topics.length < 1) {
      return res.redirect('/app/topics');
    }
    if (!req.user.gravatarUrl) {
      req.user.setGravatarUrl();
    }
    /*var friendsStr = "[{name: 'sina', state: 'online'}, {name: 'ali', state: 'offline'}\
      , {name: 'vahid', state: 'offline'}]";*/
    var data = {
      development: req.development,
      user: req.user,
      gravatarUrl: req.user.gravatarUrl,
    };
    return res.render('chat', data);
  } else {
    var data = {
      development: req.development
    };
    var flashes = req.flash('error');
    if (flashes && flashes.length > 0) {
      data['message'] = flashes[0];
    }
    return res.render('index', data);
  }
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

module.exports.about = function (req, res) {
  res.render('about');
};

module.exports.rules = function (req, res) {
  res.render('rules');
};
