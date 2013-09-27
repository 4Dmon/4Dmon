var cp = require( "child_process" )
	, async = require( "async" )
	, winston = require( "winston" )
	, valise = require( "valise" )
	, systemInfoLogger = winston.loggers.get( "systemInfo" )
	, _ = require( "underscore" )
	, recSysInfo
	, cmd
	, path = require( "path" )
	, trackerId = path.basename( __filename, ".js" )
	, getLogger = valise( "lib:trackers-util" ).getStatLogger
	, formatStatId
	, statCommunicationError = "communication_error"
	, logKeys = ["OS Version",
		"System Boot Time",
		"Total Physical Memory",
		"Available Physical Memory",
		"Virtual Memory: Available",
		"Virtual Memory: In Use"]
	;

// ---------------------------------------------
// Function that logs the current system info
// (Windows specific)
// ---------------------------------------------
module.exports = function( done ) {

	// ---------------------------------------------
	// Execute a series of asynchronous methods
	// 1) Perform the systeminfo command
	// 2) Parse the info from the output
	// 3) Logging!
	// ---------------------------------------------
	async.waterfall([
			// ---------------------------------------------
			// Kick off the systeminfo command
			// ---------------------------------------------
			function( cb ) {
				cp.exec( 'systeminfo /FO csv', cb );
			},

			// ---------------------------------------------
			// Parse info from the response
			// ---------------------------------------------
			function( stdout, stderr, cb ) {
				// ---------------------------------------------
				// First, split the string into keys and values.
				// In CSV format, they are separated by a newline.
				// ---------------------------------------------
				var parts = stdout.trim().split("\n")
					, keys
					, values
					, data = {}
					, i
					;

				// ---------------------------------------------
				// Now we have two large strings, keys and values.
				// We need to split these up by "," and then remove
				// leading and trailing quotes
				// ---------------------------------------------
				keys = parts[0].split('","');
				values = parts[1].split('","');

				if(keys.length === 32 && values.length === 32) {
					keys[0] = keys[0].replace('"', '');
					keys[31] = keys[31].replace('"', '');
					values[0] = values[0].replace('"', '');
					values[31] = values[31].replace('"', '');
				}

				// ---------------------------------------------
				// Assemble the data object
				// ---------------------------------------------
				for (i = 0; i < keys.length; i++) {
					data[keys[i]] = values[i];
				}
				cb(null, data);
			},

			// ---------------------------------------------
			// Log the data. We log an individual line for
			// each piece of data that we wish to store
			// ---------------------------------------------
			function( data, cb ) {

				// ---------------------------------------------
				// This warrants some explanation- We only want
				// to proceed to the Final Callback (below) after
				// we finish our loop. However, cb (which came in
				// as a parameter) will lead right to it. So that
				// we only make the final callback once, we wrap
				// cb in another function which only gets executed
				// after being called 6 times (logKeys.length).
				// On the last time through the loop, this function
				// will execute cb and send us to the final callback.
				// In this way, we maintain the linear nature of
				// the async waterfall and avoid branching out at
				// the bottom.
				// ---------------------------------------------
				var callback = _.after( logKeys.length, cb );

				logKeys.forEach( function( key ) {
					getLogger( trackerId, formatStatId( key ) )
						.info(data[key], callback );
				});

			}
		],

		// -----------------------------------------------------
		// Final callback
		// -----------------------------------------------------
		function( error ) {
			if( error ) { // Whoops! We're just down for maintenance right?
				getLogger( trackerId, statCommunicationError )
					.warn( "Sysmon error --> " + error,
						function() {
							done();
						});
			} else {
				done();
			}
		}

	);

};

// -----------------------------------------------------
// SysInfo keys are ill-suited to server as ids for our purposes
// -----------------------------------------------------
formatStatId = function( key ) {
	var id = key;

	// Remove leading/trailing white space
	id = id.trim();

	// strip away special characters
	id = id.replace( /[^\w\s]/g, "" );

	// Collapse white space to single underscore
	id = id.replace( /\s+/g, "_" );

	// Lowercase only please!
	id = id.toLowerCase();

	return id;
};

// ---------------------------------------------
// Return an array of objects representing the
// data we want to return and what logger to get
// it from.
// ---------------------------------------------
module.exports.getStats = function() {

	var stats = []
		, i
		;

	for (i = 0; i < logKeys.length; i++) {
		stats.push({
			"id": formatStatId( logKeys[i] ),
			"name": logKeys[i]
		});
	}

	stats.push({
		"id": statCommunicationError,
		"name": "Communication Error"
	});

	return stats;
};
