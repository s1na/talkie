var config = require('./config')
  , User = require('./db').User
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
  },
  function (username, password, done) {
    User.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'نام کاربری برای ورود اشتباه است.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'رمز عبور اشتباه است.' });
      }
      return done(null, user);
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: config.googleClientId,
  clientSecret: config.googleClientSecret,
  callbackURL: config.siteUrl + '/auth/google/callback',
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOne({id: profile.id}).where({'provider.provider': 'google'}).
      exec(function (err, user) {
      if (err) {
        logger.err('passport', err);
      } else if (!user) {
        console.log(profile);
        /*var user = User({
          firstname: profile.name.givenName,
          lastname: profile.name.lastName,
          username: profile.displayName,
          email: profile.emails[0].value,
          verified: true,
          provided: true,
          provider: {
            name: 'google',
            id: profile.id
          }
        });
        user.save()*/
      } else if (user) {
        return done(null, user);
      }
    });
    return done(err, user);
}));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


module.exports = {
  passport: passport
};
