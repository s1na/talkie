/*
 * Serve JSON to our AngularJS client
 */

var parseCookie = require('express').cookieParser();

exports.version = function (req, res) {
  res.json({
    version: '1'
  });
};

module.exports.userData = function(req, res) {
  res.json({
    fullName: req.session.fullName,
    sessionToken: req.session
  });
};

