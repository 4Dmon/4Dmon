
module.exports.jtr = function( req, res ) {
	var winston = require( "winston" )
		, logger = winston.loggers.get( "serverMemory" )
		, fromTime = new Date()
		;

	logger.info( "foobar", function() {
		//console.dir( arguments );
		logger.query({
			from: fromTime,
			until: new Date()
		}, function( err, results ) {
			console.dir( results, false, 2 );
			res.end( JSON.stringify( results, null, "  " ) );
		});
	});
};

module.exports.jtr2 = function( req, res ) {
	var valise = require( "valise" )
		, memmon = valise( "trackers:memmon" )
		, winston = require( "winston" )
		, logger = winston.loggers.get( "serverMemory" )
		, fromTime = new Date()
		;

	memmon( function() {

		logger.query({
			from: fromTime,
			until: new Date()
		}, function( err, results ) {

						console.dir( results, false, 2 );

						results = results.file.filter( function( el ) {
							var i
								, k
								, keys
								, pattern
								, filters = [{
									"tag": "bar"
								}]
								;

							for( i = filters.length; i--; ) {
								keys = Object.keys( filters[i] );
								for( k = keys.length; k--; ) {
									pattern = typeof filters[i][keys[k]] === "string" ?
										new RegExp( "^" + filters[i][keys[k]] + "$") : filters[i][keys[k]];
									if( !( results[keys[k]] && pattern.test( results[keys[k]] ) ) ) {
										return false;
									}
								}
							}
							return true;
						});

			console.dir( results, false, 2 );
			res.end( JSON.stringify( results, null, "  " ) );
		});

	});
};
