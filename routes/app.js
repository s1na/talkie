
var config = require('../config');

module.exports.chat = function(req, res) {
  req.session.cookie.maxAge = config.memberSessionExpiration;
  var data = {
    development: req.development,
    user: req.user,
  };
  res.render('chat', data);
};

module.exports.topics = function(req, res) {
  if (!req.user || typeof req.user === 'undefined') {
    res.redirect('/');
    return;
  }
  if (req.method == 'GET') {
    var suggestedTopics = config.topicsList;
    var selectedTopics = req.user.topics;
    if (selectedTopics.length > 0) {
      for (var it=0; it < suggestedTopics.length; it++) {
        suggestedTopics[it].selected =
          selectedTopics.indexOf(suggestedTopics[it].slug) !== -1;
      }
    }
    res.render('topics', {
      suggestedTopics: suggestedTopics,
    });
  } else if (req.method == 'POST') {
    req.user.addTopics(req.body.selectedTopics);
    if (req.user.topics.length < 1) {
      res.redirect('/app/topics');
    }
    res.redirect('/chat');
  }
};
