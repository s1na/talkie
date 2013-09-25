
/**
 * Module dependencies
 */

var routes = require('./routes'),
  routesApi = require('./routes/api'),
  routesChat = require('./routes/chat'),
  http = require('http'),
  path = require('path'),
  longjohn = require('longjohn');

var config = require('./config');
var express = config.express;
var app = config.app;
var server = config.server;
var io = config.io;
var sessionExpiration = config.sessionExpiration;

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
  cookie: {
    maxAge: sessionExpiration,
  },
}));
app.use(express.logger('dev'));
app.use(statistics());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use('/static', express.static(path.join(__dirname, 'public')));
var staticPages = ['/', '/auth', '/rules', '/about'];
app.use(authenticate(staticPages));
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
app.post('/auth', routes.auth);
app.get('/exit', routes.exit);
app.get('/chat', routesChat.chat);
app.get('/partials/:name', routes.partials);
app.get('/rules', routes.rules);
app.get('/about', routes.about);

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

function authenticate(staticPages) {
  return function (req, res, next) {
    if (staticPages.indexOf(req.path) == -1) {
      if (!req.session.loggedIn) {
        res.redirect('/');
      } else {
        next();
      }
    } else {
      next();
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

function statistics() {
  return function (req, res, next) {
    next();
  };
}
