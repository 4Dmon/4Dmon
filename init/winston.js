var winston = require( "winston" )
, valise = require( "valise" )
, fs = require( "fs" )
, path = require( "path" )
, mkdirp = require( "mkdirp" )
, logRoot = __dirname + "/../logs"
, trackerRoot = __dirname + "/../trackers"
, logfiles
;

fs.readdirSync( trackerRoot ).forEach( function( trackerPath ) {
	var trackerName = path.basename( trackerPath, ".js" )
	, tracker = valise( "trackers:" + trackerName )
	;

	tracker.getStats().forEach( function( stat ) {
		var statLogFile = path.join( logRoot, trackerName, stat.id + ".log" )
			, statLogDir = path.dirname( statLogFile )
			;

		// Each tracker has it's own directory for logging
		if( !fs.existsSync( statLogDir ) ) {
			mkdirp.sync( statLogDir );
		}

		// Loggers added in trackerid_statid format
		winston.loggers.add( trackerName + "_" + stat.id, {
			file: {
				filename: statLogFile,
				timestamp: function() {
					var today = new Date()
						, monthNum = today.getMonth() + 1
						, month = monthNum < 10 ? "0" + monthNum : "" + monthNum
						, dateNum = today.getDate()
						, date = dateNum < 10 ? "0" + dateNum : "" + dateNum
						;
						
					return today.getFullYear() + "-" + month + "-" + date + "T" + today.toLocaleTimeString();
				}
			},
			console: {
				silent: true
			}
		});
	});
});
