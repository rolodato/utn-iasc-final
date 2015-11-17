const express = require('express');
const bodyParser = require('body-parser');
const Auction = require('./models').Auction;
const path = require('./util/path');
const error = require('./util/error');
const logger = require('./logs');
const _ = require('lodash');

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
    Auction.create(
      query
    ).then(function(auction) {
      logger.info('Created auction', auction.dataValues);
      res.location(path(req, auction.id)).sendStatus(201);
    }).catch(function(err) {
      error(err, res);
    });
  });

  return api;
};
