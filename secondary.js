const logger = require('./logs');
const express = require('express');
const models = require('./models');
const url = require('url');
const sequelize = models.sequelize;
const Buyer = models.Buyer;
const Auction = models.Auction;
const Bid = models.Bid;
const moment = require('moment');
const request = require('request-promise');
require('dotenv').load();

const app = require('./server');

function findWinner(auction) {
  return Bid.findOne({where: {auctionId: auction.id}, order: [['amount', 'DESC']]})
    .then(function(winningBid) {
      return Buyer.findById(winningBid.buyerId);
    });
}

function notifyWinners(auction, buyers) {
  logger.info('Notifying winner of finished auction');
  getWinnerBid(auction).bind({}).then(function(bid){
    return Buyer.findById(bid.buyerId);
  }).then(function(winner) {
    this.winnerId = winner.id;
    winner.notify({expiredAuction: 'You are the winner, congratulations!'});
  }).then(function() {
    return Buyer.findAll( {where: {id: {$ne: this.winnerId}}} )
  }).then(function(losers) {
    losers.forEach(function(buyer) {
      buyer.notify({expiredAuction: 'You are the loser :( '});
    });
  }).then(function() {
    return Auction.update({expirationNotified: true}, {where: {id: auction.id}});
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

function getBids(auction){
  return Bid.findAll({where: {'auctionId': auction.id}});
}

function startApp() {
  logger.warn(`no heartbeat from primary server received after ${hbTimeout}ms`);
  if (!isPrimaryDown) {
    logger.warn('starting application on secondary');
    sequelize.sync().then(function() {
      logger.info('Successfully connected to database');
      // failover buyers
      return Buyer.all().then(function(buyers) {
        buyers.forEach(function(buyer) {
          buyer.newServer({url: process.env.SECONDARY_URL});
        });
      });
    }).then(function() {
      // notify expired auctions that were not notified
      return Auction.findAll({where: {expirationNotified: false, expirationDate: {$lt: moment()}}})
        .each(function(auction) {
          if (!auction) { return; }
          logger.info('Notifying of expired auction');
          return [notifyWinner(auction), notifyLosers(auction)];
        });
    }).then(function () {
      // auctions that have not expired yet
      return request.post({
        url: process.env.SECONDARY_URL + 'auctions/crons'
      }).catch(function(err) {
        logger.error(err);
      });
    })
    isPrimaryDown = true;
  }
  planFailover();
}
var startSecondary;
var isPrimaryDown = false;
const hbTimeout = 4000;
var crons;

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
