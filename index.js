require('dotenv').load();
const minimist = require('minimist');
const models = require('./models');
const sequelize = models.sequelize;
const logger = require('./logs');
const request = require('request-promise');

const argv = minimist(process.argv.slice(2));
const app = require('./server');

function heartbeat(url) {
  return function() {
    return request(url).then(function() {
      logger.debug(`OK heartbeat response from ${url}`);
    }).catch(function(err) {
      logger.error(`couldn't send heartbeat to ${url}`, err);
    });
  }
}

sequelize.sync({ force: argv.f }).then(function() {
  logger.info('Successfully connected to database');
  app.listen(process.env.EXPRESS_PORT, function() {
    logger.info('Listening on port ' + process.env.EXPRESS_PORT);
  });
  setInterval(heartbeat(process.env.SECONDARY_URL), 1000);
});
