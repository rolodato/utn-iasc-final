const winston = require('winston');

const logger = new(winston.Logger)({
  level: 'debug',
  colors: {
    debug: 'green',
    info: 'cyan',
    warn: 'yellow',
    error: 'red'
  },
  transports: [
    new(winston.transports.Console)({
      colorize: true,
      prettyPrint: true,
      timestamp: function() {
        return new Date().toISOString();
      }
    })
  ],
  formatter: function(options) {
    // https://github.com/winstonjs/winston#custom-log-format
    // Return string will be passed to logger.
    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (undefined !== options.message ? options.message : '') +
      (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
  }
});

module.exports = logger;
