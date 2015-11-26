const logger = require('./logs');
const express = require('express');
const models = require('./models');
const url = require('url');
const sequelize = models.sequelize;
const Buyer = models.Buyer;
require('dotenv').load();

const app = require('./server');

function startApp() {
  logger.warn(`no heartbeat from primary server received after ${hbTimeout}ms`);
  if (!isPrimaryDown) {
    logger.warn('starting application on secondary');
    sequelize.sync().then(function() {
      logger.info('Successfully connected to database');
      Buyer.all().then(function(buyers) {
        buyers.forEach(function(buyer) {
          buyer.newServer({url: process.env.SECONDARY_URL});
        });
      });
    })
    isPrimaryDown = true;
  }
  planFailover();
}
var startSecondary;
var isPrimaryDown = false;
const hbTimeout = 4000;

function planFailover() {
  clearTimeout(startSecondary);
  startSecondary = setTimeout(startApp, hbTimeout);
}


app.get('/', function(req, res) {
  if (!isPrimaryDown) {
    logger.debug(`received heartbeat from ${req.hostname}`);
  } else {
    logger.info(`primary is back online, received heartbeat from ${req.hostname}`);
  }
  planFailover();
});

app.listen(process.env.EXPRESS_PORT, function() {
  logger.info(`listening for heartbeats on port ${process.env.EXPRESS_PORT}`);
});
