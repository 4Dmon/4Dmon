
/*
 * GET home page.
 */

var fs = require( "fs" )
	, readmeDotMd = fs.readFileSync( __dirname + "/../README.md" ).toString()
	;

exports.home = function( req, res ){
  res.render( "home", {
		title: "Welcome to 4dmon!",
		md: readmeDotMd
	});
};
