const _ = require('lodash');
const logger = require('../logs');

module.exports = function(err, res) {
  const responses = {
    SequelizeValidationError: function(err) {
      return {
        errors: _.uniq(err.errors.map(function(e) {
          return e.message;
        })),
        status: 400
      };
    },
    SequelizeUniqueConstraintError: function() {
      return {
        errors: ['resource already exists'],
        status: 422,
      };
    },
    other: function(err) {
      return {
        errors: [err],
        status: 500
      };
    }
  };
  const responseType = responses[err.name] || responses.other;
  const response = responseType(err);
  res.status(response.status).json({
    errors: response.errors
  });
}
