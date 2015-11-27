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

function validateAuction(auction) {
  this.auction = auction;
  if (!auction) {
    return Promise.reject({status: 404, message: 'auction does not exist'});
  } else if (auction.isFinished()) {
    return Promise.reject({status: 400, message: 'auction has finished'});
  } else {
    return auction;
  }
}

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
        getBids(auction).then(function(buyers){
          return notifyWinners(auction, buyers);
        });
      });
      crons.push({'cron': c, 'auctionId': auction.id});
      res.location(path(req, auction.id)).sendStatus(201);
    }

    function notifyWinners(auction, buyers) {
      logger.info('Notifying winner of finished auction');
      getWinnerBid(auction).bind({}).then(function(bid){
        return Buyer.findById(bid.buyerId);
      }).then(function(winner) {
        this.winnerId = winner.id;
        winner.notify({expiredAuction: 'You are the winner, congratulations!'});
      }).then(function() {
        return Buyer.findAll( {where: {id: {$ne: this.winnerId}}} )
      }).then(function(losers) {
        losers.forEach(function(buyer) {
          buyer.notify({expiredAuction: 'You are the loser :( '});
        });
      }).then(function() {
        return Auction.update({expirationNotified: true}, {where: {id: auction.id}});
      });
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
      return Bid.findAll({where: {'auctionId': auction.id}});
    }

    function getBidders(bids, auction){
      return [bids.map(function(bid){
          return Buyer.findById(bid.buyerId);
        }), auction];
    }

    function getWinnerBid(auction){
      return Bid.findOne({where: {auctionId: auction.id}, order: [['amount', 'DESC']]});
    }

      Auction.create(query).bind({})
      .then(createSchedule)
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

    function createBid(auction) {
      return Bid.create(query);
    }

    function notifyBidders(bids) {
      const self = this;
      logger.info(`New bid: $${this.bid.amount} on auction ${this.bid.auctionId} from buyer ${this.bid.buyerId}`);
      Promise.map(bids, function(bid) {
        return Buyer.findById(bid.buyerId);
      }).then(function(buyers) {
        buyers.forEach(function(buyer) {
          buyer.notify({
            amount: self.bid.amount,
            auctionId: self.bid.auctionId,
            bidderId: self.bid.buyerId
          });
        });
      })
      res.sendStatus(201);
    }

    function getBidders(bid){
      this.bid = bid;
      return Bid.findAll({where: {'auctionId': bid.auctionId}});
    }

    Promise.all([Auction.findById(auctionId), Buyer.findById(query.buyerId)]).bind({})
      .spread(validateAuction)
      .then(createBid)
      .then(getBidders)
      .then(notifyBidders)
      .catch(function(err) {
        error(err, res);
      });
  });

  api.post('/:auctionId/cancel', function(req, res) {
    function notifyBuyers(bids) {
      const self = this;
      logger.info(bids.length);
      logger.info(`Cancel auction: ${this.auction.id}`);
      return Promise.map(bids, function(bid) {
        return Buyer.findById(bid.buyerId);
      }).then(function(bidders) {
        bidders.forEach(function(bidder) {
          bidder.notify({auctionCanceled: self.auction.id});
        });
      });
    }

    function getBids(){
      return Bid.findAll({where: {'auctionId': this.auction.id}});
    }

    function cancelAuctionCron(auction){
      this.auction = auction;
      var c = _.findWhere(crons,{'auctionId': auction.id});
      if(!c){
        logger.info('Could not find cron for:', auction.dataValues);
        return Promise.reject({status: 404, message: 'cron does not exist'});
      }else{
        c.cron.cancel();
        _.pull(crons, c);
        return auction;
      }
    }

    function cancelAuction() {
      logger.info('Canceled auction', this.auction.id);
      return this.auction.cancel();
    }

    const auctionId = req.params.auctionId;
    Auction.findById(auctionId).bind({})
      .then(validateAuction)
      .then(cancelAuctionCron)
      .then(cancelAuction)
      .then(getBids)
      .then(notifyBuyers)
      .catch(function(err) {
        error(err, res);
      });
  });

  return api;
};
