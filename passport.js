var User = require('./db').User
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'نام کاربری برای ورود اشتباه است.' });
      }
      if (!user.verified) {
        return done(null, false, { message: 'ایمیل شما تایید نشده است.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'رمز عبور اشتباه است.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


module.exports = {
  passport: passport
};
