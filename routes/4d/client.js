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
	, clientConf = nconf.get( "4dclient" )
	, actionUtil = valise( "lib:action-util" )
	, parseString = require( "xml2js" ).parseString
	;

exports.index = function( req, res ) {
	res.render( "4d/info", {
		title: "4D Client Status"
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
			res.end("ERROR with exexScript! " + error);
		}
		else {
			res.end("Output: " + stdout + (stderr ? ("\nError: " + stderr) : ""));
		}	
	}

	actionUtil.executeScript( "client", req.params.action, cb);
	
};

exports.info = function( req, res ) {

	// -----------------------------------------------------
	// Make the request server-side to eliminate cross-domain
	// conflicts.
	// -----------------------------------------------------
	request(
		{
			uri: clientConf.appRoutes.appstate,
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
			res.render("4d/client/info", {appstate: appstate});
		}
	);

};

exports.stop = function( req, res ) {
	res.render("4d/client/stop", {});
};

exports.start = function( req, res ) {
	res.render("4d/client/start", {});
};

exports.backup = function( req, res ) {
	res.render("4d/client/backup", {});
};