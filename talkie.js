
/**
 * Module dependencies
 */

var routes = require('./routes'),
  routesApi = require('./routes/api'),
  routesChat = require('./routes/chat'),
  http = require('http'),
  path = require('path');

var config = require('./config');
var express = config.express;
var app = config.app;
var server = config.server;
var io = config.io;

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('less-middleware')({ src : __dirname + '/public', enable: ['less']}));
app.use(express.cookieParser(config.secretKey));
app.use(express.session({
  store: config.redisStore,
  secret: config.secretKey,
  prefix: config.sessionPrefix,
}));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
var staticPages = ['/', '/rules', '/about'];
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
      console.log('Not in statics, ' + req.path);
      if (!req.session.loggedIn) {
        res.redirect('/');
      }
    }
    next();
  };
}
