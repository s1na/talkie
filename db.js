var mongoose = require('mongoose')
  , config = require('./config')
  , utils = require('./utils');

// Schemas
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
  gravatarUrl: String,
  credits: {type: Number, default: 0},
});

userSchema.set('autoIndex', true);
userSchema.methods.validPassword = function (password) {
  return utils.validateHash(this.password, password);
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

userSchema.methods.addFriend = function (userId) {
  if (!userId ||
      typeof userId === undefined ||
      userId === this.id
     ) return false;
  if (this.friends.indexOf(userId) === -1) {
    this.friends.push(userId);
    this.save();
    return true;
  };
  return false;
};

userSchema.methods.removeFriend = function (userId) {
  if (!userId || typeof userId === undefined) return false;
  if (this.friends.indexOf(userId) !== -1) {
    this.friends.splice(this.friends.indexOf(userId), 1);
    this.save();
    return true;
  }
  return false;
};

userSchema.methods.initOnline = function () {
  var friendsStr = '';
  for (var i = 0; i < this.friends.length; i++) {
    friendsStr += "'" + this.friends[i];
  }
};

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
    utils.md5(this.email.trim().toLowerCase());
  this.save();
}

// Models
User = mongoose.model('User', userSchema);

// Exports
module.exports.User = User;
