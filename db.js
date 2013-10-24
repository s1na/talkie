var mongoose = require('mongoose')
  , hash = require('./hash');

// Schemas
reportedSchema = new mongoose.Schema({
  ip: String,
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
  ip: String,
  expires: Date
});

userSchema = new mongoose.Schema({
  username: { type: String, index: {unique: true}},
  firstname: String,
  lastname: String,
  email: {type: String, index: {unique: true}},
  password: String,
  verified: Boolean,
});

userSchema.set('autoIndex', false);
userSchema.methods.validPassword = function (password) {
  return hash.validateHash(this.password, password);
};

// Models
Reported = mongoose.model('Reported', reportedSchema);
Banned = mongoose.model('Banned', bannedSchema);
User = mongoose.model('User', userSchema);

// Exports
module.exports.Reported = Reported;
module.exports.Banned = Banned;
module.exports.User = User;
