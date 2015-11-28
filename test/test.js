const Promise = require('bluebird');
const app = Promise.promisifyAll(require('../server'));
const Buyer = Promise.promisifyAll(require('../clients/buyer'));
const request = require('request-promise');
const logger = require('../logs');
const url = require('url');
require('dotenv').load();
const ip = process.env.LOCAL_IP;
const moment = require('moment');
const sequelize = require('../models').sequelize;

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

// TODO Refactor this
// Adjudicacion simple, smoke test
const serverUrl = 'http://localhost:3000/';

sequelize.sync({force: true}).then(function() {
  return buyer1.register(serverUrl);
}).then(function() {
  return request.post({
    json: {
      title: 'my auction',
      expirationDate: moment().add(10,'s'),
      basePrice: 15
    },
    url: serverUrl + 'auctions/',
    resolveWithFullResponse: true
  });
}).then(function(res) {
  // register() sets ID in buyer object
  const auctionId = res.headers.location.split('/').pop();
  return [auctionId, buyer2.register(serverUrl)];
}).spread(function(auctionId) {
  return [buyer1.bid(30, auctionId), buyer2.bid(42, auctionId)];
}).then(function() {
  logger.info('Test successful! Waiting for notifications to finish...');
  setTimeout(function() {
    process.exit(0);
  }, 2000000);
}).catch(function(err) {
  logger.error('Test failed!', err);
  process.exit(1);
});
