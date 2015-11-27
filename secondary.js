const logger = require('./logs');
const express = require('express');
const models = require('./models');
const url = require('url');
const sequelize = models.sequelize;
const Buyer = models.Buyer;
const Auction = models.Auction;
const Bid = models.Bid;
const moment = require('moment');
require('dotenv').load();

const app = require('./server');

function findWinner(auction) {
  return Bid.findOne({where: {auctionId: auction.id}, order: [['amount', 'DESC']]})
    .then(function(winningBid) {
      return Buyer.findById(winningBid.buyerId);
    });
}

function notifyWinner(auction) {
  return findWinner(auction)
    .then(function(winner) {
      winner.notify({expiredAuction: 'You are the winner :)'});
      return [auction, winner];
    });
}

function notifyLosers(auction) {
  return findWinner(auction)
    .then(function(winner) {
      return Buyer.findAll( {where: {id: {$ne: winner.id}}} );
    }).each(function(loser) {
      loser.notify({expiredAuction: 'You are the loser :('});
    })
}

function startApp() {
  logger.warn(`no heartbeat from primary server received after ${hbTimeout}ms`);
  if (!isPrimaryDown) {
    logger.warn('starting application on secondary');
    sequelize.sync().then(function() {
      logger.info('Successfully connected to database');
      // failover buyers
      Buyer.all().then(function(buyers) {
        buyers.forEach(function(buyer) {
          buyer.newServer({url: process.env.SECONDARY_URL});
        });
      });
      // notify expired auctions that were not notified
      Auction.findAll({where: {expirationNotified: false, expirationDate: {$lt: moment()}}})
        .each(function(auction) {
          logger.info(`Notifying of ${auction.length} expired auctions`);
          return [notifyWinner(auction), notifyLosers(auction)];
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
  res.sendStatus(200);
});

app.listen(process.env.EXPRESS_PORT, function() {
  logger.info(`listening for heartbeats on port ${process.env.EXPRESS_PORT}`);
});
