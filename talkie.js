
/**
 * Module dependencies
 */

var routes = require('./routes'),
  routesAuth = require('./routes/auth'),
  routesApi = require('./routes/api'),
  routesApp = require('./routes/app'),
  http = require('http'),
  path = require('path'),
  longjohn = require('longjohn'),
  flash = require('connect-flash');

var config = require('./config'),
  express = config.express,
  app = config.app,
  server = config.server,
  io = config.io,
  statistics = require('./statistics'),
  passport = require('./passport').passport,
  db = require('./db'),
  Banned = db.Banned,
  backend = require('./backend'),
  utils = require('./utils');

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
if (app.get('env') === 'development') {
  app.use(require('less-middleware')({ src : __dirname + '/public', enable: ['less']}));
}
app.use(determineEnv());
app.use(express.cookieParser(config.secretKey));
app.use(express.session({
  store: config.redisStore,
  secret: config.secretKey,
  prefix: config.sessionPrefix,
  cookie: { expires: true, maxAge: config.sessionExpiration },
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
//app.use(isBanned());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use('/static', express.static(path.join(__dirname, 'public')));
// app.use(statistics());
var appPages = ['/', '/api/user-data', '/app/topics',
                '/verification', '/verification/resend',
                '/missing-data'];
app.use(authenticate(appPages));
//app.use(express.favicon(path.join(__dirname, 'public/img/fav.gif')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('/rules', routes.rules);
app.get('/about', routes.about);

//app.post('/auth', routesAuth.auth);

app.post('/auth/mobile', routesAuth.authMobile);
app.get('/auth/mobile', routesAuth.authMobile);

app.options('/login', function (req, res, next) {
  utils.setCORS(req, res);
  return res(200);
});

app.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    var isMobile = utils.isMobile(req);
    if (isMobile) {
      utils.setCORS(req, res);
    }
    if (err) {
      logger.err('passport', info);
      return next(err);
    }
    if (!user) {
      if (isMobile) {
        return res.json({
          okay: false, message: info.message,
          sessionID: req.sessionID,
        });
      } else {
        req.flash('error', info.message);
        return res.redirect('/');
      }
    }
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      if (!user.verified) {
        return res.redirect('/verification');
      } else if (!user.name) {
        return res.redirect('/missing-data');
      } else {
        if (isMobile) {
          return res.json({
            okay: true,
            sessionID: req.sessionID,
          });
        } else {
          return res.redirect('/');
        }
      }
    });
  })(req, res, next);
});

app.options('/signup', function (req, res, next) {
  utils.setCORS(req, res);
  return res(200);
});

app.post('/signup', routesAuth.signup);
app.get('/verification', routesAuth.verification);
app.post('/verification', routesAuth.verification);
app.post('/verification/resend', routesAuth.verificationResend);
app.get('/verify/:key', routesAuth.verify);
app.get('/missing-data', routesAuth.missingData);
app.post('/missing-data', routesAuth.missingData);
app.get('/auth/google', passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email']
}));

app.get('/auth/google/callback', function (req, res, next) {
  passport.authenticate('google', function (err, user, info) {
    if (err) {
      logger.err('passport', info);
      return next(err);
    }
    req.login(user, function (err) {
      if (err) {
        logger.err('passport', err);
        return next(err);
      } else if (!user.topics.length) {
        return res.redirect('/app/topics');
      } else {
        return res.redirect('/');
      }
    });
  })(req, res, next);
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', function (req, res, next) {
  passport.authenticate('facebook', function (err, user, info) {
    if (err) {
      logger.err('passport', info);
      return next(err);
    }
    req.login(user, function (err) {
      if (err) {
        logger.err('passport', err);
        return next(err);
      } else if (!user.topics.length) {
        return res.redirect('/app/topics');
      } else {
        return res.redirect('/');
      }
    });
  })(req, res, next);
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', function (req, res, next) {
  passport.authenticate('twitter', function (err, user, info) {
    if (err) {
      logger.err('passport', info);
      return next(err);
    }
    req.login(user, function (err) {
      if (err) {
        logger.err('passport', err);
        return next(err);
      } else if (!user.topics.length) {
        return res.redirect('/app/topics');
      } else {
        return res.redirect('/');
      }
    });
  })(req, res, next);
});

app.get('/exit', routesAuth.exit);

app.get('/chat', routesApp.chat);
app.get('/app/topics', routesApp.topics);
app.post('/app/topics', routesApp.topics);

// JSON API
app.get('/api/version', routesApi.version);
app.get('/api/user-data', routesApi.userData);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication
io.sockets.on('connection', require('./routes/socket'));

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

function isBanned() {
  return function (req, res, next) {
    if (req.path.indexOf('/static') === 0) {
      next();
    }
    var ip;
    if (req.headers['x-nginx-proxy']) {
      ip = req.headers['x-real-ip'];
    } else {
      ip = req.connection.remoteAddress;
    }
    Banned.findOne({ip: ip}, function (err, banned) {
      if (err || !banned) {
        next();
      } else {
        if (banned.expires <= new Date(Date.now())) {
          banned.remove(function (err) {
            if (err) {
              console.error('[Middleware] Could not remove banned from db.');
            }
          });
          next();
        } else {
          var output = banned.remainingBanTime();
          res.render('banned', {expireDate: output});
        }
      }
    });
  };
}

function authenticate(appPages) {
  return function (req, res, next) {
    if (req.path.indexOf('/static') === 0 ) {
      return;
    }
    if (appPages.indexOf(req.path) == -1) {
      next();
    } else {
      if (req.path === '/') {
        if (req.user) {
          if (req.user.isBanned()) {
            var output = req.user.remainingBanTime();
            backend.remOnline(user, 'all');
            res.render('banned', {expireDate: output});
          } else if (!req.user.verified && req.path.indexOf('/verification') !== 0) {
            return res.redirect('/verification');
          } else if (req.user.isMissingData() && req.path.indexOf('/missing-data') !== 0) {
            return res.redirect('/missing-data');
          } else {
            next();
          }
        } else {
          next();
        }
      } else {
        if (typeof req.user === 'undefined' ||
            !req.user) {
          req.flash('error', 'لطفا ابتدا وارد شوید.');
          res.redirect('/');
        } else if (req.user.isBanned()) {
          var output = req.user.remainingBanTime();
          backend.remOnline(user, 'all');
          res.render('banned', {expireDate: output});
        } else if (!req.user.verified && req.path.indexOf('/verification') !== 0) {
          return res.redirect('/verification');
        } else if (req.user.isMissingData() && req.path.indexOf('/missing-data') !== 0) {
          return res.redirect('/missing-data');
        } else {
          next();
        }
      }
    }
  };
}

function determineEnv() {
  return function (req, res, next) {
    req.development = false;
    if (app.get('env') === 'development') {
      req.development = true;
    }
    next();
  };
}
