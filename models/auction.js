const moment = require('moment');

module.exports = function(sequelize, Types) {
  return sequelize.define('Auction', {
    title: {
      type: Types.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    basePrice: {
      type: 'NUMERIC',
      allowNull: false,
      validate: {
        notEmpty: true,
        min: 0
      }
    },
    expirationDate: {
      type: Types.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
        isFuture: function(value) {
          if(!moment().isBefore(value)){
            throw new Error('Date must be in the future!');
          }
        }
      }
    },
    isCanceled: {
      type: Types.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    expirationNotified: {
      type: Types.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    instanceMethods: {
      isExpired: function() {
        return moment().isAfter(this.expirationDate);
      },
      isFinished: function() {
        return this.isExpired() || this.isCanceled;
      },
      cancel: function() {
        return this.update({ isCanceled: true });
      }
    }
  });
};
