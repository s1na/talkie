
var config = require('../config')
  , rdb = config.rdb
  , rdbLogger = config.rdbLogger
  , logger = require('../logger')
  , db = require('../db')
  , User = db.User
  , sendMail = require('../email').sendMail
  , utils = require('../utils')
  , backend = require('../backend');


exports.auth = function (req, res) {
  if (req.user) {
    res.redirect('/');
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
    res.redirect('/');
  }
};


exports.signup = function (req, res) {
  var gender = {
    'مرد': 'M',
    'زن': 'F',
  };
  if (typeof req.body.email.toLowerCase() === 'undefined') {
    logger.err(req.body.email);
  }
  if (typeof req.body.firstname !== 'string' ||
      typeof req.body.lastname !== 'string' ||
      typeof req.body.email !== 'string' ||
      typeof req.body.password !== 'string' ||
      typeof req.body.passwordConfirm !== 'string' ||
      typeof req.body.gender !== 'string') {
    req.flash('error', 'از پر کردن تمام فیلد‌ها اطمینان حاصل کنید.');
    return res.redirect('/');
  } else if (!req.body.firstname.trim() ||
             !req.body.lastname.trim() ||
             !req.body.email.trim() ||
             req.body.password.length === 0 ||
             req.body.passwordConfirm.length === 0 ||
             !req.body.gender.trim() ||
             !(req.body.gender in gender)
            ) {
    req.flash('error', 'از پر کردن تمام فیلد‌ها اطمینان حاصل کنید.');
    return res.redirect('/');
  } else if (req.body.password !== req.body.passwordConfirm) {
    req.flash('error', 'رمز‌های عبور وارد شده با یکدیگر همخوانی ندارند.');
    return res.redirect('/');
  } else if (!req.body.email.toLowerCase().match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    req.flash('error', 'لطفا ایمیل وارد شده را دوباره بررسی کنید.');
    return res.redirect('/');
  } else if (typeof req.body.email.toLowerCase() === 'undefined' ||
             req.body.email.toLowerCase().indexOf('www.') === 0) {
    if (typeof req.body.email.toLowerCase() === 'undefined') {
      logger.err('auth', 'Email lower case undefined');
      logger.err('auth^', req.body.email);
    }
    req.flash('error',
              'آدرس ایمیل با www. شروع نمی‌شود. دوباره بررسی بفرمایید.'
             );
    return res.redirect('/');
  } else {
    var firstMatch = req.body.firstname.match(/^[\u0600-\u06FF\ \‌]+$/);
    var lastMatch = req.body.lastname.match(/^[\u0600-\u06FF\ \‌]+$/);
    if (!(firstMatch && lastMatch)) {
      req.flash('error',
        'نام و نام خوانوادگی فقط می‌توانند از حروف الفبا تشکیل شده باشند.'
      );
      return res.redirect('/');
    }

    req.body.email = req.body.email.toLowerCase();
    var user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      gender: gender[req.body.gender],
      email: req.body.email,
      password: utils.createHash(req.body.password),
      verified: false,
    });
    user.save(function (err, user) {
      if (err) {
        logger.err('Index',
                   'Failed to create user.'
                  );
        logger.err('Index^',
                   err);
        if (err.message.indexOf('duplicate') !== -1) {
          if (err.message.indexOf('$username') !== -1) {
            req.flash('error', 'این نام کاربری قبلا گرفته شده است.');
            return res.redirect('/');
          } else if (err.message.indexOf('$email') !== -1) {
            req.flash('error', 'این ایمیل قبلا ثبت شده است.');
            return res.redirect('/');
          }
        } else {
          req.flash('error', 'ساخت کاربر با مشکل برخورد کرد.');
          return res.redirect('/');
        }
      } else {
        var verificationUrl = 'http://horin.ir/verify/' + user.id;

        var data = {
          to: req.body.email,
          subject: 'تایید عضویت در هورین',
          template: 'email-verification',
          vars: {
            verificationUrl: verificationUrl,
            name: req.body.name
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
      return res.redirect('/');
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
          name: req.user.name
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
            name: req.user.name
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

exports.missingData = function (req, res) {
  if (req.method === 'GET') {
    var attrList = req.user.missingData();
    if (attrList.length === 0) {
      return res.redirect('/');
    }
    var data = {attrList: attrList,};
    var flashes = req.flash('error');
    if (flashes && flashes.length > 0) {
      data['message'] = flashes[0];
    }
    res.render('missing-data', data);
  } else if (req.method === 'POST') {
    if (!req.body.firstname ||
        !req.body.lastname ||
        typeof req.body.firstname !== 'string' ||
        typeof req.body.lastname !== 'string' ||
        !req.body.firstname.trim() ||
        !req.body.lastname.trim()) {
      req.flash('error', 'لطفا دوباره تمام فیلد‌ها را بررسی کنید.');
      return res.redirect('missing-data');
    } else {
      if (!req.user || typeof req.user === 'undefined') {
        return res.redirect('/');
      } else {
        var firstMatch = req.body.firstname.match(/^[\u0600-\u06FF\ \‌]+$/);
        var lastMatch = req.body.lastname.match(/^[\u0600-\u06FF\ \‌]+$/);
        if (firstMatch && lastMatch) {
          req.user.firstname = req.body.firstname;
          req.user.lastname = req.body.lastname;
          req.user.save();
          return res.redirect('/');
        } else {
          req.flash('error',
            'نام و نام خوانوادگی فقط می‌توانند از حروف الفبا تشکیل شده باشند.'
          );
          return res.redirect('/missing-data');
        }
      }
    }
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
  if (req.user && typeof req.user !== 'undefined') {
    backend.remOnline(req.user, 'all');
  }
  req.logout();
  req.session.destroy();
  res.redirect('/');
};

exports.authMobile = function (req, res) {
  console.log(req.body.email);
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Origin', req.headers.origin);
  res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers',
             'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  /*res.set('Access-Control-Allow-Headers', 'http://localhost');
  res.set('Access-Control-Allow-Headers', 'x-requested-with');
  res.set('Access-Control-Allow-Methods', 'POST, GET');*/
  return res.jsonp({status: true});
};
