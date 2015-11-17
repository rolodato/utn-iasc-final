const _ = require('lodash');
const logger = require('../logs');

module.exports = function(err, res) {
  const responses = {
    SequelizeValidationError: {
      errors: _.uniq(err.errors.map(function(e) {
        return e.message;
      })),
      status: 400
    },
    SequelizeUniqueConstraintError: {
      errors: ['resource already exists'],
      status: 422
    }
  };
  const response = responses[err.name] || {
    errors: [err],
    status: 500
  }
  logger.warn(response.errors);
  res.status(response.status).json({
    errors: response.errors
  });
}
