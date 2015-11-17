const express = require('express');
const bodyParser = require('body-parser');
const Buyer = require('./models').Buyer;
const path = require('./util/path');
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
    Buyer.create(
      query
    ).then(function(buyer) {
      logger.log('info', 'Created buyer', buyer.dataValues);
      res.location(path(req, buyer.id)).sendStatus(201);
    });
  });

  return api;
};
