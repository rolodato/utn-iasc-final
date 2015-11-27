const express = require('express');
const url = require('url');
const logger = require('../logs');
const bodyParser = require('body-parser');
const request = require('request-promise').defaults({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  resolveWithFullResponse: true,
  json: true
});

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}

module.exports = function Buyer(options) {
  const self = this;
  const app = express();
  app.use(bodyParser.json());

  app.post('/notify', function(req, res) {
    logger.info(`New notification for buyer ${self.buyerId}`, req.body);
    res.sendStatus(200);
  });

  app.post('/newServer', function(req, res) {
    logger.warn(`Primary server is down, switching to ${req.body.url}`);
    self.serverUrl = req.body.url;
    res.sendStatus(200);
  });

  this.name = options.name;
  this.callbackUrl = url.parse(options.callbackUrl);
  // ID is set after registering
  this.buyerId = null;
  this.serverUrl = null;
  this.register = function(serverUrl) {
    return request.post({
      url: serverUrl + 'buyers/',
      body: {
        name: this.name,
        callbackUrl: url.format(this.callbackUrl)
      }
    }).then(function(res) {
      self.buyerId = res.headers.location.split('/').pop();
      self.serverUrl = serverUrl;
      return self.buyerId;
    });
  };
  this.bid = function(amount, auctionId) {
    if (!self.buyerId || !self.serverUrl) {
      return Promise.reject('user must register before bidding');
    }
    return request.post({
      url: `${self.serverUrl}auctions/${auctionId}/bid`,
      body: {
        amount: amount,
        buyerId: self.buyerId
      }
    });
  };
  this.listen = function(cb) {
    app.listen(this.callbackUrl.port, this.callbackUrl.hostname, cb);
  }
};
