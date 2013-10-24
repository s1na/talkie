var path = require('path')
  , nodemailer = require('nodemailer')
  , emailTemplates = require('email-templates')
  , logger = require('./logger')
  , templatesDir = path.resolve(__dirname, 'views', 'email')
  , config = require('./config')
  , emailUsername = config.emailUsername
  , emailPassword = config.emailPassword;


// Prepare nodemailer transport object
var transport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: emailUsername,
    pass: emailPassword
  }
});

module.exports.sendMail = function (data) {
  emailTemplates(templatesDir, function(err, template) {
    if (err) {
      logger.err('Email',
                 err
                );
    } else {
      template(data.template, data.vars, function(err, html, text) {
        if (err) {
          logger.err('email',
                     err
                    );
        } else {
          transport.sendMail({
            from: emailUsername,
            to: data.to,
            subject: data.subject,
            html: html,
            // generateTextFromHTML: true,
            text: text
          }, function(err, responseStatus) {
            if (err) {
              logger.err('email',
                         err
                        );
            } else {
              logger.info('email',
                          responseStatus.message
                         );
            }
          });
        }
      });
    }
  });
};
