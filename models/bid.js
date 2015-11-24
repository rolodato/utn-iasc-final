const request = require('request-promise');
const logger = require('../logs');
const url = require('url');
const Promise = require('bluebird');

module.exports = function(sequelize, Types) {
  const Bid = sequelize.define('Bid', {
    amount: {
      type: 'NUMERIC',
      allowNull: false,
      validate: {
        min: 1
      }
    },
    buyerId: {
      type: Types.INTEGER,
      references: {
        model: 'Buyers',
        key: 'id'
      }
    },
    auctionId: {
      type: Types.INTEGER,
      references: {
        model: 'Auctions',
        key: 'id'
      }
    }
  }, {
    validate: {
      highestBidder: function() {
        const self = this;
        return Bid.max('amount', {
          where: {
            auctionId: this.auctionId
          }
        }).then(function(topBid) {
          if (self.amount < topBid) {
             return Promise.reject('bid must be higher than the highest bidder');
          }
        });
      }
    }
  });

  return Bid;
};
