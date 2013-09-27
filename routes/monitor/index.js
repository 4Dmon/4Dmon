var path = require( "path" )
	, cp = require( "child_process" )
	, valise = require( "valise" )
	, socketUtil = valise( "lib:socket-util" )
	, monitorUtil = valise( "lib:monitor-util" )
	;

exports.startMonitor = function( req, res ) {
	var connections = socketUtil.totalConnections();
	// ---------------------------------------------
	// Start the watchdog as a separate process
	// Only start if there are no socket connections,
	// meaning the monitor process is not yet started
	// ---------------------------------------------
	if(connections === 0) {
		// watchdog = cp.exec("node monitor/watchdog.js");
		// watchdog.stdout.pipe(process.stdout);
		// watchdog.stderr.pipe(process.stderr);
		monitorUtil.startMonitor();
		res.end("Monitor process started");
	}
	else {
		res.end("There are already " + connections + " socket connections. Watchdog may already be started.")
	}
	
}

exports.stopMonitor = function( req, res ) {
	// ---------------------------------------------
	// Ask listening processes to kill themselves
	// ---------------------------------------------
	socketUtil.emitKill();
	res.end("Monitor process stopped");
}

exports.monitorListening = function( req, res ) {
	res.type("text/plain");
	if(socketUtil.totalConnections() > 0) {
		res.end("true");
	}
	else {
		res.end("false");
	}
}