const express = require('express');
const bodyParser = require('body-parser');
const Buyer = require('./models').Buyer;
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
    const query = _.pick(req.body, 'name', 'callbackUrl');
    logger.debug('Creating buyer', query);
    Buyer.create(
      query
    ).then(function(buyer) {
      logger.info('Created buyer', buyer.dataValues);
      res.location(path(req, buyer.id)).sendStatus(201);
    }).catch(function(err) {
      error(err, res);
    });
  });

  return api;
};
