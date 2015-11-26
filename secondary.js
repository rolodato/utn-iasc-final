const logger = require('./logs');
const express = require('express');
require('dotenv').load();

const app = express();

function startApp() {
  logger.warn(`no heartbeat from primary server received after ${hbTimeout}ms`);
  if (!isPrimaryDown) {
    logger.warn('starting application on secondary');
    // TODO Start application and notify clients
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
