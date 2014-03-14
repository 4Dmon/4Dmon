	//, tasklist = valise( "lib:tasklist" )
var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, logmonConf = nconf.get( "logmon" )
	, path = require( "path" )
	, trackerId = path.basename( __filename, ".js" )
	, trackerUtil = valise( "lib:trackers-util" )
	, fs = require("fs")
	, async = require( "async" )
	, _ = require( "underscore" )
	, statID = "logs"
	, logMonHelper = require( "../trackerHelper" )
	, bufferMax = 100
	;

function debugLog (text) {
	if(true){fs.appendFile('logmon-debug.log', text + '\n');}
}

// -----------------------------------------------------
// Create a trackerHelper for each tracked logfile
// -----------------------------------------------------
var helpers = [];
var fds = logmonConf.logFiles;
_.each(fds, function(fd) {
	debugLog("watching: " + fd);
	helpers.push(logMonHelper.helpWatch(fd));
});

// -----------------------------------------------------
// Export as a method that takes a "done" callback
// -----------------------------------------------------
module.exports = (function(){
	var logger, done;

  return function( cb ) {
		logger = trackerUtil.getStatLogger( trackerId, statID );

		// -----------------------------------------------------
		// Retrieve any info from each of our log file buffers
		// -----------------------------------------------------
		var loggerFunc = function(line, name) {
				debugLog("Logging line: " + line);
				logger.info(name + ": " + line);
		};

		_.each(helpers,function(helper) {
			var newStuff = helper.getAnyNewEntries()
			_.each(newStuff, function(line){
				loggerFunc(line, helper.fileName);
			});
		});

		cb();
	};
})();

// -----------------------------------------------------
// What stats are we tracking?
// -----------------------------------------------------
module.exports.getStats = function() {
	return [{
		"id": statID,
		"name": "Latest log entry",
	}];
};

// -----------------------------------------------------
// Returns the newest logs in the tracker's statLogger.
// -----------------------------------------------------
module.exports.getLogs = function(req, res) {
	logger = trackerUtil.getStatLogger( trackerId, statID );
	logger.query({rows: 100, order: "desc"}, function( err, results ) {
		var logs = results.file;

		// Logs are posted at the info level
		logs = _.where( logs, {
			level: "info"
		});

		res.json({ logs: _.pluck(logs,"message") });
	});
}
