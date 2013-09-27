var  md = require( "node-markdown" ).Markdown
	;

// -----------------------------------------------------
// Let our views render markdown content
// -----------------------------------------------------
exports.markdown = function( req, res, next ) {
	res.locals.markdown = md;
	next();
};

exports.statics = function( req, rew, next ) {
	// -----------------------------------------------------
	// [todo]
	// Fetch static files from our static file server rather than locally?
	// [/todo]
	// -----------------------------------------------------
	next();
};
