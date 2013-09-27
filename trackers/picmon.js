var cp = require("child_process")
	, async = require("async")
	, path = require("path")
	, join = path.join
	, fs = require("fs")
	, os = require("os")
	, valise = require("valise")
	, nconf = valise("lib:config-util").nconf
	, fourdclient = nconf.get("4dclient")
	, fourdserver = nconf.get("4dserver")
	, tasklist = valise( "lib:tasklist" )
	, monitorUtil = valise( "lib:monitor-util" )
	, _ = require("underscore")
	, winston = require("winston")
	, screenshotLogger = winston.loggers.get("screenshotLog")
	, takeAPicture
	, trackerUtil = valise( "lib:trackers-util" )
	, trackerId = path.basename( __filename, ".js" )
	, statClientScreenshot = "client_screenshot"
	, statServerScreenshot = "server_screenshot"
	, statDesktopScreenshot = "desktop_screenshot"
	;

module.exports = function( allDone ) {

	// ---------------------------------------------
	// Determine if we should take pictures of 4D
	// server or 4D client.
	// ---------------------------------------------

	var runsClient = monitorUtil.machineRunsClient()
		, runsServer = monitorUtil.machineRunsServer()
		;

	// ---------------------------------------------
	// We need to take the pictures in a synchronous
	// series or else we might end up with two pictures
	// of the same thing!
	// ---------------------------------------------
	async.series([
		function(callback) {
			if(runsClient) {
				takeAPicture(
					"client",
					trackerUtil.getStatLogger( trackerId, statClientScreenshot ),
					callback
				);
			}
			else {
				callback(null);
			}
		},
		function(callback) {
			if(runsServer) {
				takeAPicture(
					"server",
					trackerUtil.getStatLogger( trackerId, statServerScreenshot ),
					callback
				);
			}
			else {
				callback(null);
			}
		},
		function(callback) {
			if(!runsClient && !runsServer) {
				takeAPicture(null, screenshotLogger, callback);
			}
			else {
				callback(null);
			}
		}
	],
	function(err, results) {
		allDone();
	});

};

// ---------------------------------------------
// Function that takes a screenshot and logs
// the location that it wrote the file to.
// Most importantly, you must pronounce this
// method name with a fake British accent.
// ---------------------------------------------
takeAPicture = function( appName, logger, done ) {

	// ---------------------------------------------
	// First, setup some variables such as paths
	// and filenames
	// ---------------------------------------------
	var exePath = join(__dirname, "../resources/screenshot-cmd.exe")
	, maximize4DPath = join(__dirname, "../resources/maximize-4D.exe")
	, maximizeServerPath = join(__dirname, "../resources/maximize-4D-server.exe")
	, shotsPath
	, fileName
	, currentDate = new Date()
	, ddmmyyyy
	, destFile
	;

	// ---------------------------------------------
	// Make sure that the path to the screenshots folder
	// exists. If it doesn't, make it.
	// ---------------------------------------------
	ddmmyyyy = (currentDate.getMonth() + 1) + "-" + currentDate.getDate() + "-" + currentDate.getFullYear();
	shotsPath = join(__dirname, "../public/images/screenshots/", ddmmyyyy);
	fs.exists(shotsPath, function (exists) {
		if(!exists) {
			fs.mkdirSync(shotsPath);
		}
	});

	// ---------------------------------------------
	// Use the system name and current time for the filename
	// ---------------------------------------------
	if(appName) {
		fileName = os.hostname() + "_" + appName + "_" + currentDate.toLocaleTimeString().replace(/:/g,"") + ".png";
	}
	else {
		fileName = os.hostname() + "_" + currentDate.toLocaleTimeString().replace(/:/g,"") + ".png";
	}
	destFile = join(shotsPath, fileName);


	// ---------------------------------------------
	// Execute a series of asynchronous methods
	// 1) Execute a command to bring 4D/4D Server to front
	// 2) Execute a command to take the picture
	// 3) Logging!
	// ---------------------------------------------
	async.waterfall([

		// ---------------------------------------------
		// If an appname was passed in (client or server)
		// execute a command to maximize it and bring it
		// to the front.
		// TODO
		// I'm having trouble with waiting until the window
		// is completely maximized before moving on. The .exe
		// seems to signal completion before the window is
		// completely maximized.
		// I've added a sleep for one second command to the
		// maximize scripts so that they have time to come
		// up before the picture is taken.
		// ---------------------------------------------
		function( cb ) {
			switch(appName) {
				case "client":
					cp.exec(maximize4DPath, cb);
					break;
				case "server":
					cp.exec(maximizeServerPath, cb);
					break;
				default:
					cb(null, null, null);
					break;
			}
		},

		// ---------------------------------------------
		// Execute the command to take the picture
		// ---------------------------------------------
		function( stdout, stderr, cb ) {
			cp.exec(exePath + " -o " + destFile, cb);
		},

		// ---------------------------------------------
		// Make sure there were no errors
		// ---------------------------------------------
		function( stdout, stderr, cb ) {

			// ---------------------------------------------
			// There was an error if (1) there was stuff in
			// stderr, or (2) the file couldn't be found at
			// its destination.
			// ---------------------------------------------
			if(stderr) {
				cb( new Error("Picmon encountered an error when taking a screenshot! - " + stderr));
			}
			else {
				fs.exists(destFile, function (exists) {
					if(exists) {
						// No errors! Move along...
						cb(null, destFile);
					}
					else {
						// Image file wasn't there! Error!
						cb( new Error("Picmon didn't find an image at the expected destination! - " + destFile));
					}
				});
			}
		},

		// ---------------------------------------------
		// Log the file location
		// ---------------------------------------------
		function( file, cb ) {
			logger.info(file, {
				"appName": appName || "desktop"
			}, function() {
				cb();
			});
		}
		],

		// ---------------------------------------------
		// Final callback
		// ---------------------------------------------
		function( error ) {
			if( error ) { // Whoops! We're just down for maintenance right?
				logger.warn( "Picmon error --> " + error,
					function() {
						done();
					});
			} else {
				done();
			}
		}
	);

};

module.exports.getStats = function() {
	return [{
		"id": statClientScreenshot,
		"name": "Client Screenshot"
	},{
		"id": statServerScreenshot,
		"name": "Server Screenshot"
	},{
		"id": statDesktopScreenshot,
		"name": "Desktop Screenshot"
	}];
};
