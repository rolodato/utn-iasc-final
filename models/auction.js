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
      validate: {
        notEmpty: true,
        isFuture: function(value) {
          // TODO
        }
      }
    }
  });
};
