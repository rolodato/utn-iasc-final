const Promise = require('bluebird');
const sequelize = require('../models').sequelize;
const Buyer = Promise.promisifyAll(require('../clients/buyer'));
const request = require('request-promise');
const logger = require('../logs');
const url = require('url');
require('dotenv').load();
const ip = process.env.LOCAL_IP;

var bidPrice = 10;

const buyer1 = new Buyer({
  name: 'alice',
  callbackUrl: `http://${ip}:4001/`
});
buyer1.listen();
const buyer2 = new Buyer({
  name: 'bob',
  callbackUrl: `http://${ip}:4002/`
});
buyer2.listen();

const serverUrl = 'http://localhost:3000/';
const secondaryUrl = 'http://localhost:3001/';
sequelize.sync({
  force: true
}).then(function() {
  return [buyer1.register(serverUrl), buyer2.register(serverUrl)];
}).then(function() {
  return request.post({
    json: {
      title: 'my auction',
      expirationDate: '3000-01-01',
      basePrice: 15
    },
    url: serverUrl + 'auctions/',
    resolveWithFullResponse: true
  });
}).then(function(res) {
  return res.headers.location.split('/').pop();
}).then(function(auctionId) {
  function bid(buyer, auctionId) {
    return function() {
      buyer.bid(bidPrice, auctionId).then(function() {
        bidPrice += 10;
        logger.info(`buyer ${buyer.name} bid $${bidPrice}`);
      }).catch(function(err) {
        logger.warn(`${buyer.name} failed to bid on auction`);
      });
    }
  }
  setInterval(bid(buyer1, auctionId), 2000);
  setTimeout(function() {
    setInterval(bid(buyer2, auctionId), 2000);
  }, 1000);
  setTimeout(function() {
    request.post({
      url: secondaryUrl + 'auctions/' + auctionId + '/cancel'
    });
  }, 10 * 1000);
}).catch(function(err) {
  logger.error('Test failed!', err);
  process.exit(1);
});
