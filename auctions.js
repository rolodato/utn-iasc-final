const express = require('express');
const bodyParser = require('body-parser');
const Auction = require('./models').Auction;
const Buyer = require('./models').Buyer;
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

  return api;
};
