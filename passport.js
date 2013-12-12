var config = require('./config')
  , User = require('./db').User
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy;

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
    var data = profile._json;
    User.findOne({email: data.email}, function (err, user) {
      if (err) {
        logger.err('passport', err);
      } else if (!user) {
        var user = User({
          firstname: profile.name.givenName,
          lastname: profile.name.lastName,
          gender: data.gender === 'male' ? 'M' : 'F',
          email: data.email,
          verified: data.verified_email,
          provided: true,
          providers: [{
            name: 'google',
            id: profile.id,
            link: data.link,
            avatar: data.picture
          }]
        });
        user.save()
        return done(null, user);
      } else if (user) {
        var providerAdded = false;
        for (var i = 0; i < user.providers.length; i++) {
          if (user.providers[i].provider === 'google') {
            providerAdded = true;
            break;
          }
        }
        if (!providerAdded) {
          user.providers.push({
            provider: 'google',
            id: data.id,
            link: data.link,
            avatar: data.avatar,
          });
          user.save();
        }
        return done(null, user);
      }
    });
  }
));

/*passport.use(new FacebookStrategy({
  clientID: config.facebookClientId,
  clientSecret: config.facebookClientSecret,
  callbackURL: config.siteUrl + '/auth/facebook/callback',
  },
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
  }
));*/

/*passport.use(new TwitterStrategy({
    consumerKey: config.twitterConsumerKey,
    consumerSecret: config.twitterConsumerSecret,
    callbackURL: config.siteUrl + "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    var data = profile._json;
    User.findOne({email: data.email}, function (err, user) {
      if (err) {
        logger.err('passport', err);
      } else if (!user) {
        var user = User({
          email: data.screen_name.toLowerCase() + '@twitterdummymail.com',
          provided: true,
          providers: [{
            name: 'twitter',
            id: profile.id,
            link: data.url,
            avatar: data.profile_image_url,
            name: data.name,
            screen_name: data.screen_name,
            description: data.description,
            location: data.location,
            followers_count: data.followers_count,
            friends_count: data.friends_count,
            listed_count: data.listed_count,
            created_at: data.created_at,
            favourites_count: data.favourites_count,
            statuses_count: data.statuses_count,
          }]
        });
        user.save()
        return done(null, user);
      } else if (user) {
        var providerAdded = false;
        for (var i = 0; i < user.providers.length; i++) {
          if (user.providers[i].provider === 'twitter') {
            providerAdded = true;
            break;
          }
        }
        if (!providerAdded) {
          user.providers.push({
            name: 'twitter',
            id: profile.id,
            link: data.url,
            avatar: data.profile_image_url,
            name: data.name,
            screen_name: data.screen_name,
            description: data.description,
            location: data.location,
            followers_count: data.followers_count,
            friends_count: data.friends_count,
            listed_count: data.listed_count,
            created_at: data.created_at,
            favourites_count: data.favourites_count,
            statuses_count: data.statuses_count,
          });
          user.save();
        }
        return done(null, user);
      }
    });
  }
));*/

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
