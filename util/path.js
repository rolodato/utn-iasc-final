const url = require('url');

module.exports = function(req, id) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: url.resolve(req.originalUrl, id.toString())
  });
};
