var fs = require( "fs" )
	, path = require( "path" )
	, mkdirp = require( "mkdirp" )
	, dir = path.normalize( __dirname + "/../public/images/screenshots" )
	;

if( !fs.existsSync( dir ) ) {
	mkdirp.sync( dir );
}
