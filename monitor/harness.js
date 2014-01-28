require( __dirname + "/../init" );

var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, async = require( "async" )
	, _ = require( "underscore" )
	, request = require("request")
	, winston = require( "winston" )
	, io = require( "socket.io-client" )
	, logger = winston.loggers.get( "harnessLog" )
	, actionLogger = winston.loggers.get( "actionLog" )
	, conf = nconf.get( "monitor" )
	, emailConf = nconf.get( "email" )
	, envConf = nconf.get( "env" )
	, trackerUtil = valise( "lib:trackers-util" )
	, monitorUtil = valise( "lib:monitor-util" )
	, actionUtil = valise( "lib:action-util")
	, emailUtil = valise( "lib:email-util" )
	, harness
	, lastIntervalTime = Date.now()
	, isEverythingCool
	, tooManyErrors
	, takeAction
	, takeActionHelper
	, heartbeat
	, recentErrors
	, getReadyToTakeActionLater
	, makeActionFunction
	, ohSnapAlertTheDevs
	, didIFixIt
	, socket
	;

// ---------------------------------------------
// Initialize the badness checking env variable
// so that the monitor can be run separately from
// the web server if necessary
// ---------------------------------------------
process.env.CHECK_BADNESS = "true";

// ---------------------------------------------
// Create a socket connection to the server
// ---------------------------------------------
socket = io.connect("http://localhost:" + envConf.socketPort);

// ---------------------------------------------
// Respond to events emitted by the webserver
// which indicate that the CHECK_BADNESS variable
// has changed.
// ---------------------------------------------
socket.on('checkBadness', function (check) {
    console.log("Harness received event, change CHECK_BADNESS to:" + check);
    process.env.CHECK_BADNESS = check;
    getReadyToTakeActionLater(); // Reset all the errors that have been detected
});


harness = function() {
	async.series(
		[
			function( cb ) {
				// -----------------------------------------------------
				// Is everything cool?
				// -----------------------------------------------------
				isEverythingCool( function( error ) {
					if( null === error ) {
						getReadyToTakeActionLater();
					}
					cb( error );
				});
			},

			// -----------------------------------------------------
			// If we've got this far everything should be cool (i.e. no badness). Have
			// we waited our timeout period since the last tracker run?
			// -----------------------------------------------------
			function( cb ) {
				if( conf.interval.timeout + lastIntervalTime < Date.now() ) {
					console.log( "############  Running INTERVAL trackers " + Date.now() + " ############" );
					trackerUtil.runTrackers( "interval", function() {
						// Update the time we last ran our interval trackers
						lastIntervalTime = Date.now();
						cb();
					});
				} else {
					cb();
				}
			}

		],

		// -----------------------------------------------------
		// The final callback - if an error is passed assume badness! Run all the
		// "crash" trackers and set our badness flag!
		// -----------------------------------------------------
		function( err ) {
			if( err && tooManyErrors( err ) ) {
				// -----------------------------------------------------
				// Badness! Take a crash dump
				// -----------------------------------------------------
				takeAction();
			} else {
				setTimeout( harness, conf.pulse );
			}

			// -----------------------------------------------------
			// Let anyone watching know we're still here - do this at the end so our
			// first heartbeat isn't misleading (i.e. "All's well!" when it really
			// isn't
			// -----------------------------------------------------
			heartbeat();
		}
	);
};

tooManyErrors = function( error ) {
	// -----------------------------------------------------
	// Record this error
	// -----------------------------------------------------
	recentErrors.push( error.toString() );
	// -----------------------------------------------------
	// But make sure we're only keeping count of consecutive errors
	// -----------------------------------------------------
	var numRecentErrors = recentErrors.length;
	if( recentErrors.length > 1 ) {
		if( recentErrors[numRecentErrors-1] !== recentErrors[numRecentErrors-2] ) {
			recentErrors = [error.toString()];
		}
	}

	// -----------------------------------------------------
	// Let's avoid an infinitely growing array...
	// -----------------------------------------------------
	if( recentErrors.length > conf.badStuff.errorTolerance + 2 ) {
		recentErrors.shift();
	}

	// -----------------------------------------------------
	// Let the caller know if we've got more errors than our fault tolerance will
	// allow (only the first time though) [todo] Fix this [/todo]
	// -----------------------------------------------------
	return recentErrors.length === conf.badStuff.errorTolerance + 1;
};

isEverythingCool = function( done ) {
	// -----------------------------------------------------
	// If at any point we determine that bad stuff is going down we should return
	// a new error object. Note that the order of the checks below *does* matter.
	// `isEverythingCool` will report an error at the first sign of badness.
	// -----------------------------------------------------
	async.series([
		// ---------------------------------------------
		// Is badness checking enabled?
		// ---------------------------------------------
		function( cb ) {
			return process.env.CHECK_BADNESS === "true" ?
				cb() : done();
		},

		// -----------------------------------------------------
		// Is the 4D server process running?
		// -----------------------------------------------------
		function( cb ) {
			return conf.badStuff.serverDown.check ?
				monitorUtil.serverUpCheck( cb ) : cb();
		},

		// -----------------------------------------------------
		// Is Client running? ... do we need it to be on this setup?
		// -----------------------------------------------------
		function( cb ) {
			return conf.badStuff.clientDown.check ?
				monitorUtil.clientUpCheck( cb ) : cb();
		},

		// -----------------------------------------------------
		// Is client connected to server? do we need it to be?
		// -----------------------------------------------------
		function( cb ) {
			return conf.badStuff.clientDisconnect.check ?
				monitorUtil.clientConnectedCheck( cb ) : cb();
		},

		// -----------------------------------------------------
		// Are our web requests being served?
		// -----------------------------------------------------
		function( cb ) {
			return conf.badStuff.webRequests.check ?
				monitorUtil.webRequestsCheck( cb ) : cb();
		}

	], done );
};

// -----------------------------------------------------
// Let anyone watching know we're still here and keeping an eye on things
// -----------------------------------------------------
heartbeat = function() {
	if( conf.heartbeat.show ) {
		var msg = ((process.env.CHECK_BADNESS === "true") ? "All is well!" : "Badness check override: CHECK_BADNESS set to FALSE")
			, showColors = conf.heartbeat.colors
			, color = showColors ? "\033[32m" : ""
			, resetColor = showColors ? "\033[0m" : ""
			;

		if(process.env.CHECK_BADNESS !== "true") {
			color = showColors ? "\033[35m" : "";
		}
		else if( recentErrors.length > conf.badStuff.errorTolerance ) {
			msg = "Badness!";
			color = showColors ? "\033[31m" : "";
		} else if( recentErrors.length ) {
			msg = "Sketchiness...";
			color = showColors ? "\033[33m" : "";
		}

		process.stdout.write( color + ">>>" + resetColor );
		process.stdout.write( " " + Date.now() + " " );
		process.stdout.write(
			color +
			msg + " " +
			( recentErrors.length ? recentErrors[0] : "" ) +
			resetColor
		);
		process.stdout.write( "\n" );
	}
};

// -----------------------------------------------------
// What to do when badness strikes?
// -----------------------------------------------------
takeActionHelper = function( theError ) {

	// -----------------------------------------------------
	// Run our badness trackers
	// -----------------------------------------------------
	console.warn( "############  Running BADNESS trackers " + Date.now() + " ############" );
	trackerUtil.runTrackers( "badness", function() {
		setTimeout( harness, conf.pulse );
	});

	// -----------------------------------------------------
	// Do anything this particular badness requires to correct
	// -----------------------------------------------------
	if( recentErrors.length > conf.badStuff.errorTolerance) {
		var lastErr = recentErrors[0].split("Error: ")[1] // Remove the first part of the error string
			, actions
			, badThing
			, i
			, obj
			;

		actionLogger.warn("4dmon encountered an error: " + lastErr);

		// ---------------------------------------------
		// Get the list of actions
		// ---------------------------------------------
		for( obj in conf.badStuff ) {
			if( conf.badStuff.hasOwnProperty( obj ) ) {
				badThing = conf.badStuff[obj];
				if(badThing.hasOwnProperty("error")) {
					if(badThing["error"] === lastErr) {
						actions = badThing.action;
						break;
					}
				}
			}
		}

		// ---------------------------------------------
		// Start taking actions in a series to ensure
		// each of them succeeds before starting the next
		// ---------------------------------------------
		console.warn( "############  Attempting Corrective Action " + Date.now() + " ############" );

		// ---------------------------------------------
		// Create the series
		// ---------------------------------------------
		async.series(
			actions.map( makeActionFunction ),

			// ---------------------------------------------
			// The final callback
			// ---------------------------------------------
			function ( err ) {

				if( err ) {
					console.warn("---> FAILURE " + Date.now() + ": I tried to fix it but... I just couldn't :( -- " + err );
					// TODO why does this logging statement not work?!
					actionLogger.warn("4dmon failed to resolve the issue " + lastErr + ". 4dmon error was " + err );
					// -----------------------------------------------------
					// Send an "I couldn't fix the bad stuff" email
					// -----------------------------------------------------
					ohSnapAlertTheDevs( JSON.stringify(actions) + "... it was not very effective... 4dmon could not recover from badness (" + lastErr + ") and needs help: " + err,
						"NOT OK - [" + lastErr + "] 4dmon used... "
					);
				} else { // Gary was here. Ash is a loser!
					// ---------------------------------------------
					// Before reporting success, let's make sure that
					// we actually fixed the badness.
					// ---------------------------------------------
					didIFixIt(lastErr, function(fixedErr) {

						if(fixedErr === null) {
							// -----------------------------------------------------
							// Send an "I fixed it" email (Ash 4 lyfe!)
							// -----------------------------------------------------
							console.warn("---> SUCCESS " + Date.now() + ": 4dmon has fixed the badness (" + lastErr + ")");
							// TODO why does this logging statement not work?!
							actionLogger.warn("4dmon resolved the issue " + lastErr);
							ohSnapAlertTheDevs(
								JSON.stringify(actions) + "... it was super effective! 4dmon encountered some bad stuff (" + lastErr + ") but was able to recover: " + err,
								"OK - [" + lastErr + "] 4dmon used... "
							);
						} else {
							console.warn("---> POTENTIAL FAILURE " + Date.now() + ": 4dmon will check again in 60 seconds to see if the badness is still there -- " + fixedErr );
							// TODO why does this logging statement not work?!
							actionLogger.warn("4dmon may have failed to resolve the issue " + lastErr + ". 4dmon error was " + fixedErr );

							// ---------------------------------------------
							// If we didn't fix it immediately, that might be okay!
							// We should only alert the devs once we're pretty sure.
							// Check again in a minute and if we're still in trouble,
							// say so. Otherwise say it was okay.
							// ---------------------------------------------
							setTimeout(function() {
								didIFixIt(lastErr, function(err) {
									// it all worked out
									if(null === err) {
										ohSnapAlertTheDevs(
											JSON.stringify(actions) + "... it was super effective! 4dmon encountered some bad stuff (" + lastErr + ") but was able to recover: " + err,
											"OK - [" + lastErr + "] 4dmon used... "
										);
									}
									// we're still in trouble
									else {
										ohSnapAlertTheDevs( JSON.stringify(actions) + "... it was not very effective... 4dmon could not recover from badness (" + lastErr + ") and needs help: " + fixedErr,
											"NOT OK - [" + lastErr + "] 4dmon used... "
										);
									}

								})
							}, 60000);
						}

					});
				}

				// ---------------------------------------------
				// Regardless of whether we succeeded or failed
				// reset the errors so that we can detect more problems
				// ---------------------------------------------
				getReadyToTakeActionLater();

			} // end final callback
		);
	} // end recenterrors length check
};

// ---------------------------------------------
// Helper function that wraps the action in a
// function that can be placed in the series
// ---------------------------------------------
makeActionFunction = function( action ) {

	var seriesFunc
		, lastErr = recentErrors[0].split("Error: ")[1]
		;

	switch(action) {
		case "START_SERVER":
			seriesFunc = function ( cb ) {
				console.warn( "############  Trying to start SERVER " + Date.now() + " ############" );
				actionLogger.info( "4dmon performed action: " + action + " in response to error: " + lastErr );
				actionUtil.executeScript("server", "start", cb);
			};
			break;

    case "STOP_SERVER":
      seriesFunc = function ( cb ) {
        console.warn( "############  Trying to stop SERVER " + Date.now() + " ############" );
        actionLogger.info( "4dmon performed action: " + action + " in response to error: " + lastErr );
        actionUtil.executeScript("server", "stop", cb);
      };
      break;

		case "START_CLIENT":
			seriesFunc = function ( cb ) {
				console.warn( "############  Trying to start CLIENT " + Date.now() + " ############" );
				actionLogger.info( "4dmon performed action: " + action + " in response to error: " + lastErr );
				actionUtil.executeScript("client", "start", cb);
			};
			break;

		case "STOP_CLIENT":
			seriesFunc = function ( cb ) {
				console.warn( "############  Trying to stop CLIENT " + Date.now() + " ############" );
				actionLogger.info( "4dmon performed action: " + action + " in response to error: " + lastErr );
				actionUtil.executeScript("client", "stop", cb);
			};
			break;

		case "EMAIL":
			seriesFunc = function ( cb ) {
				console.warn( "############  Sent email alert " + Date.now() + " ############" );
				actionLogger.info( "4dmon performed action: " + action + " in response to error: " + lastErr );
				ohSnapAlertTheDevs(
					"4dmon encountered some bad stuff (" + lastErr + ") 4dmon will attempt to fix it and report back whether it succeeded or failed.",
					"BAD STUFF - 4dmon found " + lastErr
				);
				cb();
			};
			break;
	}

	return seriesFunc;
};

// -----------------------------------------------------
// Convenience to always use the same transport
// -----------------------------------------------------
ohSnapAlertTheDevs = function( message, subject ) {
	emailUtil.send( emailConf.defaultService, {
			to: emailConf.recipients.WATCHDOG_ERROR,
			from: emailConf.sender.name + " <" + emailConf.sender.email+ ">",
			subject: subject || "4dmon used...",
			text: message
		}
	);
};

getReadyToTakeActionLater = function() {
	// -----------------------------------------------------
	// Reset our recent errors
	// -----------------------------------------------------
	recentErrors = [];

	// -----------------------------------------------------
	// Refresh our ability to take action
	// -----------------------------------------------------
	takeAction = _.once( takeActionHelper );
};

// ---------------------------------------------
// Execute a check for the specified error to see
// if we actually fixed it or not
// ---------------------------------------------
didIFixIt = function( badness, cb2 ) {
	var cb
		;
	console.log("Checking for: " + badness);
	cb = function( err ) {
		cb2( err );
	};
	switch(badness) {
		case "SERVER_DOWN":
			return (monitorUtil.serverUpCheck(cb));

		case "CLIENT_DOWN":
			return (monitorUtil.clientUpCheck(cb));

		case "CLIENT_DISCONNECT":
			return (monitorUtil.clientConnectedCheck(cb));

		case "NO_WEB_REQUESTS":
			return (monitorUtil.webRequestsCheck(cb));

	}
}

// -----------------------------------------------------
// Kick off the monitor harness loop
// -----------------------------------------------------
getReadyToTakeActionLater();
harness();

