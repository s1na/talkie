var mongoose = require('mongoose')
  , hash = require('./hash')
  , config = require('./config')
  , utils = require('./utils');

// Schemas
/*reportedSchema = new mongoose.Schema({
  username: String,
  reporters: [String]
});

reportedSchema.methods.add = function (by) {
  if (!by) {
    console.err('[Report] Reporter has no ip.');
  } else {
    if (this.reporters.indexOf(by) === -1) {
      this.reporters.push(by);
    }
  }
};

bannedSchema = new mongoose.Schema({
  username: String,
  expires: Date
});*/

userSchema = new mongoose.Schema({
  username: { type: String, index: {unique: true}},
  firstname: String,
  lastname: String,
  gender: String,
  email: {type: String, index: {unique: true}},
  password: String,
  verified: Boolean,
  chatCount: Number,
  msgCount: Number,
  reporters: [String],
  banned: Boolean,
  banExpiration: Date,
  friends: [mongoose.Schema.Types.ObjectId],
  topics: [String],
  gravatarUrl: String
});

userSchema.set('autoIndex', true);
userSchema.methods.validPassword = function (password) {
  return hash.validateHash(this.password, password);
};

userSchema.methods.report = function (by) {
  if (this.reporters.indexOf(by) === -1) {
    this.reporters.push(by.username);
    if (this.reporters.length % config.maxReports === 0) {
      this.banned = true;
      this.banExpiration = new Date(
        Date.now() +
        (this.reporters.length / config.maxReports) * config.banExpiration
      );
    }
  }
  this.save();
};

userSchema.methods.isBanned = function () {
  if (this.banned) {
    var now = new Date(Date.now());
    if (now >= this.banExpiration) {
      this.banned = false;
      this.save();
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};

userSchema.methods.remainingBanTime = function () {
  return utils.timeDifference(this.expires, new Date(Date.now()));
};

/*userSchema.methods.addFriend = function (user) {
  if (!user) return;
  if (this.friends.indexOf(user) !== -1) {
    this.friends.push(user._id);
  };
  this.save();
};
*/
userSchema.methods.addTopics = function (topics) {
  if (!topics || typeof topics === 'undefined') return;
  if (typeof topics === 'string') {
    topics = [topics];
  }
  for (var it=0; it < topics.length; it++) {
    if (this.topics.indexOf(topics[it]) === -1) {
      this.topics.push(topics[it]);
    }
  }
  this.save();
};

userSchema.methods.setGravatarUrl = function () {
  this.gravatarUrl = 'http://gravatar.com/avatar/' +
    hash.md5(this.email.trim().toLowerCase());
  this.save();
}

// Models
//Reported = mongoose.model('Reported', reportedSchema);
//Banned = mongoose.model('Banned', bannedSchema);
User = mongoose.model('User', userSchema);

// Exports
//module.exports.Reported = Reported;
//module.exports.Banned = Banned;
module.exports.User = User;
