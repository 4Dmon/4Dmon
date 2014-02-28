require( __dirname + "/../init" );

var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, forever = require( "forever" )
	, winston = require( "winston" )
	, io = require( "socket.io-client" )
	, logger = winston.loggers.get( "watchdogLog" )
	, monitorConf = nconf.get( "monitor" ).interval
	, emailConf = nconf.get( "email" )
	, envConf = nconf.get( "env" )
	, emailUtil = valise( "lib:email-util" )
	, watchdog
	, socket
	;

watchdog = function() {

	var monitor
		, maxRestarts = monitorConf.maxRestarts
		;

	// ---------------------------------------------
	// Create a socket connection to the server.
	// Listen for events from the web server telling
	// the watchdog process to end
	// ---------------------------------------------
	socket = io.connect("http://localhost:" + envConf.socketPort);

	socket.on('die', function (die) {
		process.kill(process.pid);
	});

	// -----------------------------------------------------
	// Configure our monitor process to run through thick and thin!
	// -----------------------------------------------------
	monitor = new ( forever.Monitor )( __dirname + "/harness.js", {
		max: maxRestarts
	});

	// -----------------------------------------------------
	// Let someone know if bad stuff happens...
	// -----------------------------------------------------
	monitor.on( "exit", function() {
		logger.warn( "Monitor process has given up after restarting " + maxRestarts + " times" );

		if( monitorConf.sendEmailAfterMaxRestarts ) {

			emailUtil.send( emailConf.defaultService, {
				to:      emailConf.recipients.WATCHDOG_ERROR,
				from:    emailConf.sender.name + " <" + emailConf.sender.email + ">",
				subject: "4dmon max restarts on: " + envConf.application.name,
				text:    "Please login and address the issue."
			});

		}

		//logger.warn( "Monitor process has been restarted " + maxRestarts + " times... reinitializing now..." );
		//watchdog();
	});

	// -----------------------------------------------------
	// Do it now!
	// -----------------------------------------------------
	logger.info( "Starting interval monitor process..." );
	monitor.start();
};

watchdog();
