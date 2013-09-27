var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, async = require( "async" )
	, winston = require( "winston" )
	, appstateLogger = winston.loggers.get( "appstate" )
	, request = require( "request" )
	, _ = require( "underscore" )
	, serverConf = nconf.get( '4dserver' )
	, clientConf = nconf.get( '4dclient' )
	, trackerUtil = valise( "lib:trackers-util" )
	, parseString = require( "xml2js" ).parseString
	, recordAppState
	, path = require( "path" )
	, trackerId = path.basename( __filename, ".js" )
	, statServerTaskCount = "server_task_count"
	, statServerConnectUsers = "server_connected_users"
	, statServerDump = "server_dump"
	, statServerError = "server_error"
	, statClientTaskCount = "client_task_count"
	, statClientConnectUsers = "client_connected_users"
	, statClientDump = "client_dump"
	, statClientError = "client_error"
	, statHash = {}
	;

// -----------------------------------------------------
// For use of task id retrieval
// -----------------------------------------------------
statHash = {
	client: {
		task: statClientTaskCount,
		users: statClientConnectUsers,
		dump: statClientDump,
		error: statClientError
	},
	server: {
		task: statServerTaskCount,
		users: statServerConnectUsers,
		dump: statServerDump,
		error: statServerError
	}
};

// -----------------------------------------------------
// Export a single method that takes a "done" callback
// -----------------------------------------------------
module.exports = function( allDone ) {
	var done = _.after( 1, allDone );

	if(serverConf.appRoutes.appstate) {
		recordAppState(
			"server",
			serverConf.processName,
			serverConf.appRoutes.appstate,
			done
		);
	}
};

// -----------------------------------------------------
// General function to log the memory footprint of a
// given process (Windows specific)
// -----------------------------------------------------
recordAppState = function( clientOrServer, procName, statsUrl, done ) {

	// -----------------------------------------------------
	// async.waterfall executes a bunch of (possibly) async methods in series,
	// passing the result of each to it's successor. If an error is encountered
	// (passed as the *first* param to a callback) the waterfall chain is
	// short circuited and we jump to the final callback. At each point in the
	// chain we can assume we have not yet hit an error.
	// -----------------------------------------------------
	async.waterfall([

			// -----------------------------------------------------
			// Kick off an external process to request the 4D app's
			// internal state.
			// -----------------------------------------------------
			function( cb ) {

				console.log(statsUrl);

				var reqOptions = {
					uri: statsUrl,
					headers: {
						"X-4DMON-REQUEST":"1"
					}
				};

				request(reqOptions, function (error, response, body) {
					if(error) {
						cb( new Error( "Appmon: unable to contact application! " + error ) );
					}
					else {
						if (response.statusCode === 200) {
							// -----------------------------------------------------
							// Try to parse the resulting XML into JSON.
							// -----------------------------------------------------
							parseString(body, {trim:true, normalize:true, explicitArray:false}, function(err, result) {
								if(!err) {
									cb( null, result.response.data.appstate );
								} else {
									cb( err, null );
								}
							});

						} else {
							cb( new Error( "Appmon: unable to contact application! Status received was: " + response.statusCode ) );
						}
					}

				});

			},

			// -----------------------------------------------------
			// Put it in the logs!
			// -----------------------------------------------------
			function( data, cb ) {

				async.waterfall([

					// TaskCount (number of running processes)
					function logTaskCount( lcb ) {
						trackerUtil.getStatLogger( trackerId, statHash[clientOrServer].task )
							.info( data.taskCount, function() {
								lcb(null, data);
							});
					},

					// ClientCount (number of connected 4D Remote instances)
					function logClientCount( data, lcb ) {

						var userCount;

						if(data.clients.user) {
							if(typeof(data.clients.user) === 'string') {
								userCount = 1;
							} else {
								userCount = data.clients.user.length;
							}
						} else {
							userCount = 0;
						}

						trackerUtil.getStatLogger( trackerId, statHash[clientOrServer].users )
							.info( userCount, function() {
								lcb(null, data);
							});
					},

					// AppState dump (everything ... !)
					function logEverything( data, lcb ) {
						trackerUtil.getStatLogger( trackerId, statHash[clientOrServer].dump )
							.info( data, function() {
								lcb();
							});
					}

				], function( error ) {
					cb();
				});

			}
		],

		// -----------------------------------------------------
		// Final callback
		// -----------------------------------------------------
		function( error ) {
			if( error ) { // Whoops! We're just down for maintenance right?
				trackerUtil.getStatLogger( trackerId, statHash[clientOrServer].error )
					.warn( "Appmon could not connect to url: " + statsUrl, {
						"processName": procName,
						"error": error.toString()
					},
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
// Where are we logging to?
// -----------------------------------------------------
module.exports.getStats = function() {

	return [{
		"id": statServerTaskCount,
		"name": "Server task count"
	},{
		"id": statServerConnectUsers,
		"name": "Server Connected Users"
	},{
		"id": statServerDump,
		"name": "Server Dump of All"
	},{
		"id": statServerError,
		"name": "Server Communication Errors"
	},{
		"id": statClientTaskCount,
		"name": "Client task count"
	},{
		"id": statClientConnectUsers,
		"name": "Client Connected Users"
	},{
		"id": statClientDump,
		"name": "Client Dump of All"
	},{
		"id": statClientError,
		"name": "Client Communication Errors"
	}];

};
