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
  json: true
});

app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/auctions', function(req, res) {
  logger.info('New auction notification', req.body);
  res.sendStatus(200);
});

module.exports = function Buyer(options) {
  this.name = options.name;
  this.callbackUrl = url.parse(options.callbackUrl);
  this.register = function(serverUrl) {
    return request.post({
      url: serverUrl + 'buyers/',
      body: {
        name: this.name,
        callbackUrl: url.format(this.callbackUrl)
      }
    });
  };
  this.listen = function(cb) {
    app.listen(this.callbackUrl.port, this.callbackUrl.hostname, cb);
  }
};
