// ---------------------------------------------
// Declare variables to give us access to certain
// functions
// ---------------------------------------------
var cp = require( "child_process" ) // Used to make CLI commands
	, valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, path = require( "path" )
	, join = path.join
	, request = require( "request" )
	, serverConf = nconf.get( "4dserver" )
	, actionUtil = valise( "lib:action-util" )
	, parseString = require( "xml2js" ).parseString
	;


exports.index = function( req, res ) {
	res.render( "4d/server/info", {
		title: "4D Server Status"
	});
};

// ---------------------------------------------
// Retrieves an action from the request parameters
// and executes the corresponding script.
// ---------------------------------------------
exports.execScript = function( req, res ) {

	// ---------------------------------------------
	// Set the response type to plain text. Otherwise
	// Firefox will interpret it as XML for some reason.
	// ---------------------------------------------
	res.type("text/plain");

	var cb = function(error, stdout, stderr) {
		if (error) {
			res.end("ERROR with execScript! " + error);
		}
		else {
			res.end("Output: " + stdout + (stderr ? ("Error: " + stderr) : ""));
		}	
	}

	actionUtil.executeScript( "server", req.params.action, cb);
};

exports.info = function( req, res ) {

	// -----------------------------------------------------
	// Make the request server-side to eliminate cross-domain
	// conflicts.
	// -----------------------------------------------------
	request(
		{
			uri: serverConf.appRoutes.appstate,
			headers: {
				"X-4DMON-REQUEST": "1"
			}
		}
		, function(error, response, body) {
			if(error) {
				appstate = error;
			}
			else {
				if(response.statusCode === 200){
					
					parseString(body, {trim:true, normalize:true, explicitArray:false}, function(err, result) {
						if(!err) {
							appstate = JSON.stringify(result.response.data.appstate, null, 4);
						} else {
							appstate = "Error parsing response. Unable to retrieve appstate."
						}
					});

				} else {
					appstate = "Unable to retrieve appstate.";
				}
			}
			res.render("4d/server/info", {appstate: appstate});
		}
	);

};

exports.stop = function( req, res ) {
	res.render("4d/server/stop", {});
};

exports.start = function( req, res ) {
	res.render("4d/server/start", {});
};

// ---------------------------------------------
// Normal backup inside of the 4dmon UI
// ---------------------------------------------
exports.backup = function( req, res ) {
	res.render("4d/server/backup", {});
}

exports.build = function( req, res ) {
	res.render("4d/server/build", {});
}

