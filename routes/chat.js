
module.exports.chat = function(req, res) {
  res.render('chat', {development: req.development});
};
