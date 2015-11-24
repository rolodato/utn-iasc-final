const Promise = require('bluebird');
const app = Promise.promisifyAll(require('../server'));
const sequelize = require('../models').sequelize;
const Buyer = Promise.promisifyAll(require('../clients/buyer'));
const request = require('request-promise');
const logger = require('../logs');
const url = require('url');

const buyer1 = new Buyer({
  name: 'alice',
  callbackUrl: 'http://localhost:3001/'
});
buyer1.listen();
const buyer2 = new Buyer({
  name: 'bob',
  callbackUrl: 'http://localhost:3002/'
});
buyer2.listen();

// TODO Refactor this
// Adjudicacion simple, smoke test
const serverUrl = 'http://localhost:3000/';
sequelize.sync({
  force: true
}).then(function() {
  return app.listen(3000);
}).then(function() {
  return buyer1.register(serverUrl);
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
  // register() sets ID in buyer object
  return [res.headers.location, buyer2.register(serverUrl)];
}).spread(function(auctionUrl) {
  return buyer2.bid(42, auctionUrl);
}).then(function() {
  logger.info('Test successful! Waiting for notifications to finish...');
  setTimeout(function() {
    process.exit(0);
  }, 1000);
}).catch(function(err) {
  logger.error('Test failed!', err);
  process.exit(1);
});
