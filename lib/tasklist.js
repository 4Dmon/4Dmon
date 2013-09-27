var cp = require( "child_process" )
	, async = require( "async" )
	;


// -----------------------------------------------------
// Wrapper around shelling out for the tasklist
// -----------------------------------------------------
module.exports = function( format, cb ) {
	// -----------------------------------------------------
	// Format is optional (deafults to CSV)
	// -----------------------------------------------------
	if( format instanceof Function ) {
		cb = format;
		format = "CSV";
	}

	cp.exec( "tasklist /fo " + format, cb );
};

module.exports.processDetails = function( imageName, cb ) {
	async.waterfall([
			function( cb ) {
				cp.exec( 'tasklist /fo CSV | findstr /C:"' + imageName + '"', cb );
			},

			// -----------------------------------------------------
			// Is the process running? Parse our info from the task list data
			// -----------------------------------------------------
			function( stdout, stderr, cb ) {
				// -----------------------------------------------------
				// CSV format wraps individual elements in double quotes... so split con
				// commas sandwiched between quotes. We'll remove the leading and
				// trailing quotes later
				// -----------------------------------------------------
				var parts = stdout.trim().split( '","' )
					, data
					;

				if( parts.length === 5 ) {
					data = {
						"imageName": parts[0].replace( '"', "" ), // Leading double quote
						"processID": parts[1],
						"sessionName": parts[2],
						"sessionNumber": parts[3],
						"memoryUsage": parts[4].replace( '"', "" ) // Trailing double quote
					};
					cb( null, data );
				} else {
					cb( new Error( imageName + " is not running" ), null );
				}
			}
		],
		cb
	);
};
