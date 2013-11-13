
var config = require('../config');

module.exports.chat = function(req, res) {
  req.session.cookie.maxAge = config.memberSessionExpiration;
  res.render('chat', {development: req.development});
};

module.exports.topics = function(req, res) {
  if (!req.user || typeof req.user === 'undefined') {
    res.redirect('/');
    return;
  }
  if (req.method == 'GET') {
    suggestedTopics = config.topicsList;
    res.render('topics', {suggestedTopics: suggestedTopics});
  } else if (req.method == 'POST') {
    req.user.addTopics(req.body.selectedTopics);
    console.log(req.user.topics);
    res.redirect('/chat');
  }
};
