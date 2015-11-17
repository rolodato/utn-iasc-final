require('dotenv').load();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.PSQL_CONNECTION_STRING, { logging: false });

var db = {
  sequelize: sequelize,
  Sequelize: Sequelize
};

// Load all models dynamically from current directory
// https://github.com/sequelize/express-example/blob/master/models/index.js
fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = db;
