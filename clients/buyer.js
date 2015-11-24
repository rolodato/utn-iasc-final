const express = require('express');
const app = express();
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

app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/auctions', function(req, res) {
  logger.info('New auction notification', req.body);
  res.sendStatus(200);
});

app.post('/bids', function(req, res) {
  logger.info(`New bid notification received by ${fullUrl(req)}`, req.body);
  res.sendStatus(200);
});

module.exports = function Buyer(options) {
  const self = this;
  this.name = options.name;
  this.callbackUrl = url.parse(options.callbackUrl);
  // ID is set after registering
  this.buyerId = null;
  this.register = function(serverUrl) {
    return request.post({
      url: serverUrl + 'buyers/',
      body: {
        name: this.name,
        callbackUrl: url.format(this.callbackUrl)
      }
    }).then(function(res) {
      self.buyerId = res.headers.location.split('/').pop();
      return self.buyerId;
    });
  };
  this.bid = function(amount, auctionUrl) {
    if (!this.buyerId) {
      return Promise.reject('user must register before bidding');
    }
    return request.post({
      url: auctionUrl + '/bid',
      body: {
        amount: amount,
        buyerId: this.buyerId
      }
    });
  };
  this.listen = function(cb) {
    app.listen(this.callbackUrl.port, this.callbackUrl.hostname, cb);
  }
};
