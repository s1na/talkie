
/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  routesApi = require('./routes/api'),
  routesChat = require('./routes/chat'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var RedisStore = require('connect-redis')(express);
var db = require('./db');
var rdb = db.rdb;
var rdbLogger = db.rdbLogger;

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('less-middleware')({ src : __dirname + '/public', enable: ['less']}));
app.use(express.cookieParser());
app.use(express.session({
  store: new RedisStore({
    client: rdb,
  }),
  secret: 'This4is$highly4secure.'}));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.favicon(path.join(__dirname, 'public/img/fav.gif')));
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
app.get('/chat', routesChat.chat);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/version', routesApi.version);

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
