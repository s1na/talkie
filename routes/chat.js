
module.exports.chat = function(req, res) {
  console.log('devel, ' + req.development);
  res.render('chat', {development: req.development});
};
