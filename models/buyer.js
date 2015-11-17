module.exports = function(sequelize, Types) {
  return sequelize.define('Buyer', {
    name: {
      type: Types.STRING,
      validate: {
        notEmpty: true
      }
    },
    callbackUrl: {
      type: Types.STRING,
      validate: {
        isUrl: true
      }
    }
  }, {
    updatedAt: false
  });
};
