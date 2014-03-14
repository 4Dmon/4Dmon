var tailMod = require( "file-tail" );
var fs = require("fs");

module.exports = {
	"helpWatch" : function(fd) {
		var letters;
		
		var logMemory = [];
		var newStuff = [];
	
		var tailer = tailMod.startTailing(fd);
	
	  // -----------------------------------------------------
	  // Remember last x additions to log file, remembering only
		// new types of entries.  In addition, keep a separate 
		// list of log entries that have not yet been retrieved 
		// with the "getAnyNewEntries" method.
	  // -----------------------------------------------------
		tailer.on('line',function(line) {
			letters = justLetters(line);
			debugLog("got a new line... :" + line);
	
			if (logMemory.indexOf(letters) < 0) {
				logMemory.push(letters);
				newStuff.push(line);
			}
			
			if(logMemory.length > 1000){
				logMemory.shift();
			}
			if(newStuff.length > 1000){
				newStuff.shift();
			}
	
			debugLog("logMemory length is now: " + logMemory.length);
			debugLog("newStuff length is now: " + newStuff.length);
		});
		
		var helper = {};
		
		helper.getAnyNewEntries = function() {
			var result = newStuff.slice(0);
			newStuff = [];
			debugLog("returning new stuff: " + result);
			return result;
		};
	
		return helper;
	}
}

function justLetters (s) {
	return s.replace(/[^A-Za-z]/g, "");
}

function debugLog (text) {
	if (false) {
		fs.appendFile('logmon-helper-debug.log', text + '\n');
	}
}
