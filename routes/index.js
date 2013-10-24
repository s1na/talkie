
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
  if (req.session.loggedIn) {
    req.session.touch();
    res.redirect('/chat');
  }
  res.render('index', {development: req.development});
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

module.exports.emailTest = function (req, res) {
  data = {
    to: 'itz.s1na@gmail.com',
    subject: 'عضویت',
    template: 'email-verification',
    vars: {verificationUrl: 'http://horin.ir/something'}
  };
  setTimeout(function () { sendMail(data); }, 2);
  res.send('Sent');
};

module.exports.about = function (req, res) {
  res.render('about');
};

module.exports.rules = function (req, res) {
  res.render('rules');
};
