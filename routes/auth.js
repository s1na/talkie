
var config = require('../config'),
    rdb = config.rdb,
    rdbLogger = config.rdbLogger,
    logger = require('../logger'),
    db = require('../db'),
    hash = require('../hash'),
    User = db.User,
    sendMail = require('../email').sendMail,
    utils = require('../utils');


exports.auth = function (req, res) {
  if (req.session.loggedIn) {
    res.redirect('/chat');
  } else {
    if (typeof req.body.fullName !== 'string') {
      if (typeof req.body.fullName !== 'undefined') {
        logger.err('auth',
                   'Fullname entered for auth has typeerror'
                  );
        logger.err('auth',
                   req.body.fullName
                  );
      }
      res.redirect('/');
      return;
    } else if (req.body.fullName.trim().length === 0) {
      res.redirect('/');
      return;
    }
    var fullName = req.body.fullName;
    req.session.fullName = fullName;
    req.session.msgCount = 0;
    req.session.chatCount = 0;
    req.session.loggedIn = true;
    var ip;
    if (req.headers['x-nginx-proxy']) {
      ip = req.headers['x-real-ip'];
    } else {
      ip = req.connection.remoteAddress;
    }
    if (req.body.rememberMe) {
      req.session.cookie.maxAge = sessionExpiration;
    }
    req.session.ip = ip;
    req.session.save();
    res.redirect('/chat');
  }
};


exports.signup = function (req, res) {
  var gender = {
    'مرد': 'M',
    'زن': 'F',
  };
  if (typeof req.body.username !== 'string' ||
      typeof req.body.email !== 'string' ||
      typeof req.body.password !== 'string' ||
      typeof req.body.passwordConfirm !== 'string' ||
      typeof req.body.gender !== 'string') {
    req.flash('error', 'لطفا دوباره تلاش بفرمایید.');
    res.redirect('/');
  } else if (!req.body.username.trim() ||
             !req.body.email.trim() ||
             !req.body.password.trim() ||
             !req.body.passwordConfirm.trim() ||
             !req.body.gender.trim() ||
             !(req.body.gender in gender) ||
             !(req.body.password === req.body.passwordConfirm)
            ) {
    req.flash('error', 'لطفا دوباره تلاش بفرمایید.');
    res.redirect('/');
  } else {
    var user = new User({
      username: req.body.username,
      gender: gender[req.body.gender],
      email: req.body.email,
      password: hash.createHash(req.body.password),
      verified: false,
    });
    user.save(function (err, user) {
      if (err) {
        logger.err('Index',
                   'Failed to create user.'
                  );
        logger.err('Index^',
                   err);
        req.flash('error', 'ساخت کاربر با مشکل برخورد کرد.');
        return res.redirect('/');
      } else {
        req.session.username = req.body.username;
        req.session.save();

        var verificationUrl = 'http://horin.ir/verify/' + user.id;

        var data = {
          to: req.body.email,
          subject: 'تایید عضویت در هورین',
          template: 'email-verification',
          vars: {
            verificationUrl: verificationUrl,
            username: req.body.username
          }
        };
        setTimeout(function () { sendMail(data); }, 2);

        req.login(user, function(err) {
          if (err) {
            logger.error('signup', 'Error while logging user in.');
            logger.error('signup', err);
          } else {
            return res.redirect('/verification');
          }
        });
        return res.redirect('/verification');
      }
    });
  }
};

exports.verification = function (req, res) {
  if (req.method === 'GET') {
    if (req.user.verified) {
      return res.redirect('/chat');
    }
    var data = {
      email: req.user.email,
      message: {},
    };
    var info = req.flash('info');
    var error = req.flash('error');
    if (info && info.length > 0) {
      data.message.type = 'info';
      data.message.text = info[0];
    } else if (error && error.length > 0) {
      data.message.type = 'error';
      data.message.text = error[0];
    }
    res.render('verification', data);
  } else if (req.method === 'POST') {
    req.user.email = req.body.email;
    req.user.save();
    return res.redirect('/verification');
  }
};

exports.verificationResend = function (req, res) {
  var userId = req.user.id;
  rdb.get('verification:' + userId, function (err, val) {
    if (err) {
      logger.err('verification', err);
    } else if (!val) {
      var verificationUrl = 'http://horin.ir/verify/' + req.user.id;
      var data = {
        to: req.user.email,
        subject: 'تایید عضویت در هورین',
        template: 'email-verification',
        vars: {
          verificationUrl: verificationUrl,
          username: req.user.username
        }
      };
      setTimeout(function () { sendMail(data); }, 2);
      var nextTry = new Date(Date.now() + config.verificationResendExpiration);
      rdb.set('verification:' + userId, nextTry.toGMTString(), rdbLogger);
      req.flash('info', 'ایمیل ارسال شد.');
      return res.redirect('/verification');
    } else {
      var nextTry = new Date(val);
      var now = new Date(Date.now());
      if (now.getTime() >= nextTry.getTime()) {
        var verificationUrl = 'http://horin.ir/verify/' + req.user.id;
        var data = {
          to: req.user.email,
          subject: 'تایید عضویت در هورین',
          template: 'email-verification',
          vars: {
            verificationUrl: verificationUrl,
            username: req.user.username
          }
        };
        setTimeout(function () { sendMail(data); }, 2);
        nextTry = new Date(Date.now() + config.verificationResendExpiration);
        rdb.set('verification:' + userId, nextTry.toGMTString(), rdbLogger);
        req.flash('info', 'ایمیل ارسال شد.');
        return res.redirect('/verification');
      } else {
        var remaining = utils.timeDifference(nextTry);
        req.flash('error', 'لطفا ' + remaining + ' تلاش کنید.');
        return res.redirect('/verification');
      }
    }
  });
};

exports.verify = function (req, res) {
  /*if (typeof req.session === 'undefined') {
    res.redirect('/');
  } else if (typeof req.session.username !== 'string') {
    res.redirect('/');
  } else {
    User.findOne({username: req.session.username}, function (err, user) {
      if (err || !user) {
        logger.err('Index',
                   'Couldnt get user to validate.'
                  );
      } else {
        user.update({validated: true}, function (err, user) {
          if (err || !user) {
            logger.err('index',
                       'Coulnt set validated to true in validation.'
                      );
          }
        });
      }
    });
  }
  res.redirect('/chat');*/
  var key = req.params.key;
  User.findOne({ _id: key }, function (err, user) {
    if (err) {
      logger.err('verify',
                 err
                );
    } else if (!user) {
      req.flash('error', 'کلید فرستاده شده اشتباه می‌باشد.');
      res.redirect('/');
    } else {
      if (user.verified) {
        return res.redirect('/app/topics');
      }
      user.update({ verified: true }, function (err, user) {
        if (err) {
          logger.err('verify',
                     err
                    );
        }
      });
      user.setGravatarUrl();
      req.login(user, function (err) {
        if (err) {
          logger.err('verify',
                     'couldnt login user after verify.'
                    );
        } else {
          return res.redirect('/app/topics');
        }
      });
    }
  });
};

exports.login = function (req, res) {
  if (
    typeof req.body.username !== 'string' ||
    typeof req.body.password !== 'string' ||
    !req.body.username.trim() ||
    !req.body.password.trim()
  ) {
    logger.err('login',
               'Invalid username given.'
              );
    res.redirect('/');
  } else {
    User.findOne({username: req.body.username}, function (err, user) {
      if (err || !username) {
        logger.info('login',
                    'Couldnt find username.'
                   );
      } else {
        if (user.verified) {
          if (req.body.password === user.password) {
            req.session.loggedIn = true;
            req.session.username = user.username;
            res.redirect('/chat');
          } else {
            res.redirect('/');
          }
        } else {
          res.redirect('/verification');
        }
      }
    });
  }
};

exports.exit = function (req, res) {
  /*if (typeof req.session !== 'undefined') {
    var sw = sessionSingleton.getSessionWrapper(req.session.id);
    if (typeof sw !== 'undefined') {
      sw.destroy();
    }
    req.session.destroy();
  }*/
  req.logout();
  res.redirect('/');
};
