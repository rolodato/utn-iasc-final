const auctions = require('./auctions')();
const buyers = require('./buyers')();
const express = require('express');

const app = express();

app.disable('x-powered-by');
app.use('/buyers', buyers);
app.use('/auctions', auctions);

module.exports = app;
