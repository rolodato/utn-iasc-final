const request = require('request-promise');
const logger = require('../logs');
const url = require('url');

module.exports = function(sequelize, Types) {
  return sequelize.define('Buyer', {
    name: {
      type: Types.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    callbackUrl: {
      type: Types.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true
      }
    }
  }, {
    instanceMethods: {
      notify: function(msg) {
        request.post({
          json: msg,
          url: this.callbackUrl + 'notify/'
        }).catch(function(err) {
          logger.warn('Failed to notify buyer', err.message);
        });
      }
    },
    updatedAt: false
  });
};
