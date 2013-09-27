var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, _ = require( "underscore" )
	, trackers = nconf.get( "monitor" ).snapshot.trackers
	, logUtil = valise( "lib:log-util" )
	, getStatLogger = valise( "lib:trackers-util" ).getStatLogger
	;

exports.index = function( req, res ) {
	res.render( "snapshot/index", {
		trackers: trackers
	});
};

exports.trackerValue = function( req, res ) {
	// -----------------------------------------------------
	// Get the tracker value and send it
	// -----------------------------------------------------
	var trackerId = req.params.tracker
		, tracker = valise( "trackers:" + trackerId )
		, stats = tracker.getStats()
		, respObj = { data: [] }
		, startTime = new Date()
		, done
		;

	res.type( "application/json" );

	// -----------------------------------------------------
	// Run the tracker
	// -----------------------------------------------------
	tracker( function() {
		// -----------------------------------------------------
		// The resp obj
		// -----------------------------------------------------
		done = _.after( stats.length, function() {
			res.end( JSON.stringify( respObj ) );
		});

		// -----------------------------------------------------
		// For each of its exposed stats fetch a value
		// -----------------------------------------------------
		stats.forEach( function( statObj ) {
			getStatLogger( trackerId, statObj.id ).query({
					"from": startTime,
					"until": new Date()
				}, function( err, results ) {
					var logs = results.file
						, success = !err && logs.length
						;

					respObj.data.push({
						name: statObj.name,
						value: success ? logs[0].message : "N/A"
					});
					done();
				}
			);
		});
	});
};
