const express = require('express');
const bodyParser = require('body-parser');
const Auction = require('./models').Auction;
const Buyer = require('./models').Buyer;
const Bid = require('./models').Bid;
const path = require('./util/path');
const error = require('./util/error');
const logger = require('./logs');
const _ = require('lodash');
const Promise = require('bluebird');
const cron = require('node-schedule');

var crons = [];

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

    function createSchedule(auction){
      logger.info('Created auction', auction.dataValues);
      var c = cron.scheduleJob(auction.expirationDate, function(){
        logger.info('Expired auction:', auction.id);
        getBids(auction).all(function(buyers, auction){
          return notifyWinners(auction, buyers);
        });
      });
      crons.push({'cron': c, 'auctionId': auction.auctionId});
      res.location(path(req, auction.id)).sendStatus(201);
    }

    function notifyWinners(auction, buyers) {
      logger.info('Notifying winner of finished auction');
      getWinner(auction).then(function(winner){
        winner.notify('You are the winner, congratulations!');
        _.pull(buyers, winner);
      });
      buyers.forEach(function(buyer) {
        buyer.notify('You are the loser :( ');
      });
      return [auction, buyers];
    }

    function notifyBuyers(buyers, auction){
      logger.info('Notifying buyers of expired auction');
      getBids(auction).all(function(buyers, auction){
        buyers.forEach(function(buyer){
          buyer.notify({expiredAuction: auction});
        });
      });
      res.location(path(req, auction.id)).sendStatus(201);
    }

    function getBids(auction){
      return [Bid.findAll({where: {'auctionId': auction.id}}), auction];
    }

    function getBidders(bids, auction){
      return [bids.map(function(bid){
          return Buyer.findById(bid.buyerId);
        }), auction];
    }

    function getWinner(auction){
      return Buyer.findById(Bid.max('amount', { where: {auctionId: this.auctionId}}));
    }

      Auction.create(query)
      .then(createSchedule)
      /*.then(getBids)
      .all(getBidders)
      .all(notifyBuyers)*/
      .catch(function(err) {
        //error(err, res);
        logger.error(err);
        res.sendStatus(500);
      });
  });

  api.post('/:auctionId/bid', function(req, res) {
    const auctionId = req.params.auctionId;
    const query = _.extend(_.pick(req.body, 'amount', 'buyerId'), {
      auctionId: auctionId
    });

    function validateAuction(auction) {
      if (!auction) {
        return Promise.reject({status: 404, message: 'auction does not exist'});
      } else if (auction.isFinished()) {
        return Promise.reject({status: 400, message: 'auction has finished'});
      } else {
        return auction;
      }
    }

    function createBid(auction) {
      return [Bid.create(query), getBuyers(auction)];
    }

    function notifyBuyers(bid, buyers) {
      logger.info(`New bid: $${bid.amount} on auction ${bid.auctionId} from buyer ${bid.buyerId}`);
      buyers.forEach(function(buyer) {
        buyer.notify({
          amount: bid.amount,
          auctionId: bid.auctionId
        });
      });
      res.sendStatus(201);
    }

    function getBuyers(auction){
      return Bid.findAll({where: {'auctionId': auction.auctionId}});
    }

    Promise.all([Auction.findById(auctionId), Buyer.findById(query.buyerId)])
      .spread(validateAuction)
      .then(createBid)
      .spread(notifyBuyers)
      .catch(function(err) {
        error(err, res);
      });
  });

  api.post('/:auctionId/cancel', function(req, res) {
    function notifyBuyers(auction, buyers) {
      logger.info(`Cancel auction: ${auction.id} from buyer ${auction.buyerId}`);
      buyers.forEach(function(buyer) {
        buyer.notify({auctionCanceled: auction.auctionId});
      });
    }

    function getBuyers(auction){
      return [auction, Bid.findAll({where: {'auctionId': auction.auctionId}})];
    }

    function cancelAuctionCron(auction){
      var c = _.findWhere(crons,{'auctionId': auction.auctionId});
      if(!c){
        logger.info('Could not find cron for:', auction.dataValues);
        return Promise.reject({status: 404, message: 'cron does not exist'});
      }else{
        c.cancel();
        auction.cancel();
        logger.info('Canceled auction', auction.dataValues);
        _.pull(crons, c);  
        return auction;      
      }
    }

    const auctionId = req.params.auctionId;
    Auction.findById(auctionId)
      .then(validateAuction)
      .then(cancelAuction)
      .then(getBuyers)
      .spread(notifyBuyers)
      .catch(function(err) {
        error(err, res);
      });
  });

  return api;
};
