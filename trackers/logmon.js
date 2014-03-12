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
	, tailmod = require( "file-tail" )
	, bufferMax = 100
	;

function debugLog (text) {
	fs.appendFile('logmon-debug.log', text + '\n');
}

process.on('error', function(e) {debugLog(e);	});

function addToBuffer (line, buffer) {
	if(buffer.length > bufferMax){
		buffer.shift();
	}
	buffer.push(line);
}

var fileObjs = logmonConf.logFiles;
var fileTailObjs = [];
var fileTailBuffers = [];

_.each(fileObjs, function(logFileConf) {
	var fd = logFileConf["location"]
	,   tailObj = tailmod.startTailing(fd);
	debugLog("Watching.. " + fd)
	fileTailObjs.push(tailObj);
});

//function justLetters (s) {
//	return s.replace(/[^A-Za-z]/g, "");
//}

for (var i = 0; i < fileTailObjs.length; i++) {

	var tailer = fileTailObjs[i];

	(function() {

		var buffer = [];

		tailer.on('line',function(line) {
				buffer.push(line);
		})
		
		fileTailBuffers.push(buffer);
	})();
}


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
		var i
		,   buffer;
		
		var loggerFunc = function(line, name) {
				debugLog("Logging line: " + line);
				logger.info(name + ": " + line);
		};

		for (i = 0; i < fileObjs.length; i++) {
			buffer = fileTailBuffers[i];
			while(buffer.length>0){
				loggerFunc(buffer.pop(), fileObjs[i].name);
			}
		}

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
