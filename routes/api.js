/*
 * Serve JSON to our AngularJS client
 */

exports.version = function (req, res) {
  res.json({
    version: '1'
  });
};
