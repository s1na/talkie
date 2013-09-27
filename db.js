var mongoose = require('mongoose');

// Schemas
reportedSchema = mongoose.Schema({
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

bannedSchema = mongoose.Schema({
  ip: String,
  expires: Date
});

// Models
Reported = mongoose.model('Reported', reportedSchema);
Banned = mongoose.model('Banned', bannedSchema);

// Exports
module.exports.Reported = Reported;
module.exports.Banned = Banned;
