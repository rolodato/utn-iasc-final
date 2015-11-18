require('dotenv').load();
const minimist = require('minimist');
const models = require('./models');
const sequelize = models.sequelize;
const logger = require('./logs');

const argv = minimist(process.argv.slice(2));
const app = require('./server');

sequelize.sync({ force: argv.f }).then(function() {
  logger.info('Successfully connected to database');
  app.listen(process.env.EXPRESS_PORT, function() {
    logger.info('Listening on port ' + process.env.EXPRESS_PORT);
  });
});
