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
        buyer.notify({newAuction: auction});
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

    function validateAuction(auction) {
      if (!auction) {
        return Promise.reject({status: 404, message: 'auction does not exist'});
      } else if (auction.isFinished()) {
        return Promise.reject({status: 400, message: 'auction has finished'});
      } else {
        return auction;
      }
    }

    function createBid() {
      return [Bid.create(query), Buyer.findAll()];
    }

    function notifyBuyers(bid, buyers) {
      logger.info(`New bid: $${bid.amount} on auction ${bid.auctionId} from buyer ${bid.buyerId}`);
      buyers.forEach(function(buyer) {
        buyer.notify({
          amount: bid.amount,
          auctionId: bid.auctionId
        });
      });
      res.sendStatus(201);
    }

    Promise.all([Auction.findById(auctionId), Buyer.findById(query.buyerId)])
      .spread(validateAuction)
      .then(createBid)
      .spread(notifyBuyers)
      .catch(function(err) {
        error(err, res);
      });
  });

  api.post('/:auctionId/cancel', function(req, res) {
    function notifyBuyers(auction, buyers) {
      buyers.forEach(function(buyer) {
        buyer.notify({auctionCanceled: auction.auctionId});
      });
    }
    const auctionId = req.params.auctionId;
    Auction.findById(auctionId)
      .then(validateAuction)
      .then(cancelAuction)
      .then(notifyBuyers)
      .catch(function(err) {
        error(err, res);
      });
  });

  return api;
};
