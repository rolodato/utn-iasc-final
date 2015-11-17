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
    updatedAt: false
  });
};
