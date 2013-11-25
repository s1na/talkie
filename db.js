var mongoose = require('mongoose')
  , config = require('./config')
  , utils = require('./utils');

// Schemas
userSchema = new mongoose.Schema({
  username: String,
  firstname: String,
  lastname: String,
  gender: String,
  email: {type: String, index: {unique: true}},
  password: String,
  verified: {type: Boolean, default: false},
  chatCount: {type: Number, default: 0},
  msgCount: {type: Number, default: 0},
  reporters: [mongoose.Schema.Types.ObjectId],
  banned: {type: Boolean, default: false},
  banExpiration: Date,
  friends: [mongoose.Schema.Types.ObjectId],
  topics: [String],
  gravatarUrl: String,
  credits: {type: Number, default: 0},
  provided: {type: Boolean, default: false},
  providers: [{
    provider: String,
    id: String,
    link: String,
    avatar: String,
  }]
});

userSchema.set('autoIndex', true);

userSchema.virtual('name').get(function () {
  if (typeof this.firstname === 'undefined' &&
      typeof this.lastname === 'undefined') {
    return '';
  }
  return this.firstname + ' ' + this.lastname;
});

userSchema.methods.validPassword = function (password) {
  return utils.validateHash(this.password, password);
};

userSchema.methods.report = function (by) {
  if (this.reporters.indexOf(mongoose.Types.ObjectId(by)) === -1) {
    this.reporters.push(mongoose.Types.ObjectId(by.id));
    if (this.reporters.length >= config.maxReports) {
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

userSchema.methods.isFriend = function(uid) {
  if (this.friends.indexOf(mongoose.Types.ObjectId(uid)) === -1) {
    return false;
  } else {
    return true;
  }
};

userSchema.methods.addFriend = function (uid) {
  if (!uid ||
      typeof uid === undefined ||
      uid === this.uid
     ) return false;
  if (this.friends.indexOf(uid) === -1) {
    this.friends.push(uid);
    this.save();

    return true;
  };
  return false;
};

userSchema.methods.remFriend = function (uid) {
  if (!uid || typeof uid === undefined) return false;
  if (this.friends.indexOf(uid) !== -1) {
    this.friends.splice(this.friends.indexOf(uid), 1);
    this.save();
    return true;
  }
  return false;
};

userSchema.methods.getFriends = function (cb) {
  this.model('User').find().where('_id').in(this.friends).exec(cb);
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
