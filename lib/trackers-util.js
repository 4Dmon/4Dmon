var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, async = require( "async" )
	, monConf = nconf.get( "monitor" )
	, winston = require( "winston" )
	;

module.exports.runTrackers = function( type, cb ) {
	async.parallel(
		monConf[type].trackers.map(
			function( trackerName ) {
				return valise( "trackers:" + trackerName );
			}
		),
		cb
	);
};

module.exports.getStatLogger = function( tracker, stat ) {
  return winston.loggers.get( tracker + "_" + stat );
};
