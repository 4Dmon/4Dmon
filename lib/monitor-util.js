var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, serverConf = nconf.get( "4dserver" )
	, clientConf = nconf.get( "4dclient" )
	, monitorConf = nconf.get( "monitor" )
	, machinesConf = nconf.get( "machines" )
	, tasklist = valise( "lib:tasklist" )
	, os = require( "os" )
	, net = require( "net" )
	, request = require( "request" )
	, cp = require("child_process")
	, spawn = require("win-spawn")
	, path = require("path")
	, join = path.join
	, portqry = join(__dirname, "../resources/PortQry.exe")
	, checkPort
	;

// -----------------------------------------------------
// Is server running?
// -----------------------------------------------------
module.exports.serverUpCheck = function( cb ) {
	tasklist.processDetails( serverConf.processName, function( err, data ) {
		cb( err ? new Error( monitorConf.badStuff.serverDown.error ) : null );
	});
};

// -----------------------------------------------------
// Is client running?
// -----------------------------------------------------
module.exports.clientUpCheck = function( cb ) {
	tasklist.processDetails( clientConf.processName, function( err, data ) {
		cb( err ? new Error( monitorConf.badStuff.clientDown.error ) : null );
	});
};

// -----------------------------------------------------
// Are web requests being served?
// -----------------------------------------------------
module.exports.webRequestsCheck = function( cb ) {
	request( {uri: serverConf.appRoutes.servercheck, headers: {"X-4DMON-REQUEST":"1"}}, function( error, resp, body ) {
		cb( error || resp.statusCode !== 200 ? new Error( monitorConf.badStuff.webRequests.error ) : null);
	});
};

// -----------------------------------------------------
// Does server have a client connection?
// -----------------------------------------------------
module.exports.clientConnectedCheck = function( cb ) {

	var port = serverConf.clientServer.portNumber
		, cmd
		;

	cmd = cp.exec(portqry + " -local | find \"" + port + "\" | find /i \"established\"",
		function(error, stdout, stderr) {

			if(error !== null) {
				cb( new Error( monitorConf.badStuff.clientDisconnect.error ) );
			}

			// ---------------------------------------------
			// If we get anything in stdout, then a client
			// connection is established.
			// If not, then the client is disconnected.
			// ---------------------------------------------
			if(stdout !== null) {
				cb(null);
			}
			else {
				cb( new Error( monitorConf.badStuff.clientDisconnect.error ) );
			}
	});

};


// ---------------------------------------------
// ! Method not currently used !
// The contents used to be clientConnectedCheck
// but weren't serving their intended purpose.
// They've been moved here in case they become
// useful elsewhere.
// ---------------------------------------------
module.exports.portBlockedCheck = function( cb ) {
	// ---------------------------------------------
	// Create a mock server that tries to bind to the port 4d accepts client
	// connections on If it isn't blocked, then that port was open and we have a
	// problem! Note that we need to use the network IP that 4D uses as the host,
	// NOT 127.0.0.1
	// ---------------------------------------------
	var mockServer = net.createServer()
		, interfaces = os.networkInterfaces()
		, local = interfaces["Local Area Connection"]
		, port = serverConf.clientServer.portNumber
		, netAddress
		, i
		;

	// Within Local Area Connections, find the IPv4 address
	for(i = 0; i < local.length; i++) {
		if( local[i].family === "IPv4" ) {
			netAddress = local[i].address;
		}
	}

	// Add a listener for "address in use" errors
	mockServer.once('error', function(err){
		if(err.code === 'EADDRINUSE') {
			// Port is closed, we're all good
			cb( null );
		}
		else {
			cb( new Error("Client may be disconnected. Could not bind to port 80. Error is: " + err) );
		}
	});
	// Add a listener for when it is listening successfully
	mockServer.once('listening', function() {
		// Close this junk and make the error callback
		mockServer.once('close', function() {
			cb( new Error( monitorConf.badStuff.clientDisconnect.error ) );
		});

		mockServer.close();
	});

	// Try binding to port CLIENT_PORT
	mockServer.listen( port, netAddress );
};

// -----------------------------------------------------
// Is the machine one that runs 4D Server?
// -----------------------------------------------------
module.exports.machineRunsServer = function() {
	return machinesConf.servers.indexOf(os.hostname()) !== -1;
};

// -----------------------------------------------------
// Is the machine one that runs 4D Client?
// -----------------------------------------------------
module.exports.machineRunsClient = function() {
	return machinesConf.clients.indexOf(os.hostname()) !== -1;
};

// ---------------------------------------------
// Start the monitor process
// ---------------------------------------------
module.exports.startMonitor = function() {
	// Monitor process should use the same stdio streams as the web server
	spawn("node monitor/watchdog.js", [], { stdio: 'inherit' });
}


