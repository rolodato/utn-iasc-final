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
      notifyNew: function(auction) {
        request.post({
          json: auction.dataValues,
          url: this.callbackUrl + 'auctions/'
        }).catch(function(err) {
          logger.warn('Failed to notify buyer', err.message);
        });
      },
      notifyBid: function(bid) {
        request.post({
          json: bid,
          url: this.callbackUrl + 'bids/'
        }).catch(function(err) {
          logger.warn('Failed to notify buyers of new bid', err.message);
        });
      }
    },
    updatedAt: false
  });
};
