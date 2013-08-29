/*
 * Serve JSON to our AngularJS client
 */

exports.version = function (req, res) {
  res.json({
    version: '1'
  });
};

module.exports.userData = function(req, res) {
  res.json({
    nickname: req.session.nickname
  });
};

