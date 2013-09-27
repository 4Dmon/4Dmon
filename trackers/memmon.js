var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, async = require( "async" )
	, path = require( "path" )
	, tasklist = valise( "lib:tasklist" )
	, trackerUtil = valise( "lib:trackers-util" )
	, _ = require( "underscore" )
	, serverConf = nconf.get( "4dserver" )
	, clientConf = nconf.get( "4dclient" )
	, recMemUsage
	, trackerId = path.basename( __filename, ".js" )
	, statClientMemory = "client_memory"
	, statServerMemory = "server_memory"
	;

// -----------------------------------------------------
// Export as a method that takes a "done" callback
// -----------------------------------------------------
module.exports = function( cb ) {
	var done = _.after( 2, cb );

	recMemUsage(
    serverConf.processName,
    trackerUtil.getStatLogger( trackerId, statServerMemory ),
    done
  );

	recMemUsage(
    clientConf.processName,
    trackerUtil.getStatLogger( trackerId, statClientMemory ),
    done
  );
};

// -----------------------------------------------------
// General function to log the memory footprint of a given process (windows
// specific)
// -----------------------------------------------------
recMemUsage = function( imageName, logger, done ) {
	tasklist.processDetails( imageName, function( err, data ) {
		if( err ) {
			logger.warn( trackerId + ": encountered an error while gathering data for " + imageName, {
				"imageName": imageName,
				"error": err.toString()
			}, done );
		} else {
			logger.info( data.memoryUsage, {
				"imageName": data.imageName,
				"sessionNumber": data.sessionNumber,
				"sessionName": data.sessionName
			}, done );
		}
	});
};

// -----------------------------------------------------
// What stats are we tracking?
// -----------------------------------------------------
module.exports.getStats = function() {
	return [
		{
			"id": statServerMemory,
			"name": "Server Memory",
			"description": "Server memory usage in bytes"
		},{
			"id": statClientMemory,
			"name": "Client Memory",
			"description": "Client memory usage in bytes"
		}
	];
};
