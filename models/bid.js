const request = require('request-promise');
const logger = require('../logs');
const url = require('url');

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
  });

  return Bid;
};

