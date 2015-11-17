require('dotenv').load();
const express = require('express');
const minimist = require('minimist');
const app = express();
const models = require('./models');
const sequelize = models.sequelize;
const logger = require('./logs');

const buyers = require('./buyers')();

const argv = minimist(process.argv.slice(2));

app.disable('x-powered-by');
app.use('/buyers', buyers);

sequelize.sync({ force: argv.f }).then(function() {
  logger.info('Successfully connected to database');
  app.listen(process.env.EXPRESS_PORT, function() {
    logger.info('Listening on port ' + process.env.EXPRESS_PORT);
  });
});
