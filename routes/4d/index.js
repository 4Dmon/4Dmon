var valise = require( "valise" )
	, actionUtil = valise( "lib:action-util" )
	;


exports.index = function( req, res ) {
	res.render( "4d/list", {});
};

exports.folder = function( req, res ) {
	res.end(req.params.folder);
}

// ---------------------------------------------
// Makes a backup and returns a plain text response
// ---------------------------------------------
exports.backup = function( req, res ) {
	var output;

	output = actionUtil.backup(req.params.folder);

	res.type("text/plain");
	res.end(output);
}