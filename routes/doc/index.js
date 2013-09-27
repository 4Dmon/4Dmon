var fs = require( "fs" )
	, valise = require( "valise" )
	;

exports.index = function( req, res ) {
	var trackerId = req.params.tracker;

	console.log( trackerId );

	res.render( "doc/index", {
		md: fs.readFileSync( __dirname + "/../../doc/" + (trackerId || "index") + ".md" ).toString(),
		stats: trackerId ? valise( "trackers:" + trackerId ).getStats() : []
	});
};
