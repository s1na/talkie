
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
  if (req.method == 'GET') {
    var suggestedTopics = config.topicsList;
    var selectedTopics = req.user.topics;
    for (var it = 0; it < selectedTopics.length; it++) {
      suggestedTopics[selectedTopics[it]].selected = true;
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
