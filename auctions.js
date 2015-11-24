const express = require('express');
const bodyParser = require('body-parser');
const Auction = require('./models').Auction;
const Buyer = require('./models').Buyer;
const Bid = require('./models').Bid;
const path = require('./util/path');
const error = require('./util/error');
const logger = require('./logs');
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = function() {
  const api = express.Router({
    caseSensitive: true
  });

  api.use(bodyParser.json());

  api.all('*', function(req, res, next) {
    if (req.accepts('json')) {
      next();
    } else {
      res.status(415).send('only application/json supported');
    }
  });

  api.post('/', function(req, res) {
    const query = _.pick(req.body, 'title', 'basePrice', 'expirationDate');
    logger.debug('Creating auction', query);
    Promise.join(Auction.create(query), Buyer.all(), function(auction, buyers) {
      logger.info('Created auction', auction.dataValues);
      logger.info(`Notifying ${buyers.length} buyers of new auction`);
      buyers.forEach(function(buyer) {
        buyer.notifyNew(auction);
      });
      res.location(path(req, auction.id)).sendStatus(201);
    }).catch(function(err) {
      logger.error(err);
      error(err, res);
    });
  });

  api.post('/:auctionId/bid', function(req, res) {
    const auctionId = req.params.auctionId;
    const query = _.extend(_.pick(req.body, 'amount', 'buyerId'), {
      auctionId: auctionId
    });
    Promise.join(Auction.findById(auctionId), Buyer.findById(query.buyerId), function(auction, buyer) {
      if (!auction) {
        res.status(404).send('auction does not exist');
      } else if (auction.isFinished()) {
        res.status(400).send('auction has finished, bids not allowed');
      } else {
        return Bid.max('amount', {
          where: {
            auctionId: auctionId
          }
        });
      }
    }).then(function(topBid) {
      if (query.amount < topBid) {
        res.status(400).send(`bid is lower than the highest bidder ($${topBid})`);
      } else {
        return Bid.create(query);
      }
    }).then(function(bid) {
      logger.info(`New bid: $${bid.amount} on auction ${bid.auctionId} from buyer ${bid.buyerId}`);
      return [bid, Buyer.findAll()];
    }).spread(function(bid, buyers) {
      buyers.forEach(function(buyer) {
        buyer.notifyBid({
          amount: bid.amount,
          auctionId: bid.auctionId
        });
      });
      res.sendStatus(201);
    }).catch(function(err) {
      logger.error(err);
      error(err, res);
    });
  });

  return api;
};
