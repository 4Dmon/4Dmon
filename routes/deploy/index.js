var	valise = require( "valise" )
	, path = require( "path" )
	, nconf = valise( "lib:config-util" ).nconf
	, join = path.join
	, request = require( "request" )
	, clientConf = nconf.get( "4dclient" )
	, actionUtil = valise( "lib:action-util" )
	, parseString = require( "xml2js" ).parseString
	;

exports.initScripts = function( req, res ) {

	// ---------------------------------------------
	// We need to send the X-4DMON-REQUEST header
	// so that the server knows the request came
	// from 4dmon.
	// ---------------------------------------------
	request(
		{
			uri: clientConf.appRoutes.initscripts,
			headers: {
				"X-4DMON-REQUEST": "1"
			}
		}
		, function(error, response, body) {
			if(error) {
				res.end(JSON.stringify(error));
			}
			else {
				// ---------------------------------------------
				// A call to initscripts will run the scripts
				// on the server but will not return any meaningful
				// response. /initstatus will give us information
				// returned from the scripts, so just redirect to
				// the 4dmon page which hits that.
				// ---------------------------------------------
				res.redirect("/deploy/initStatus");
			}
	});
};

exports.initStatus = function( req, res ) {

	var message = "N/A"
		, success
		, scripts = []
		;

	// ---------------------------------------------
	// Make a request for /INITSTATUS
	// ---------------------------------------------
	request(
		{
			uri: clientConf.appRoutes.initstatus,
			headers: {
				"X-4DMON-REQUEST": "1"
			}
		}
		, function(error, response, body) {
			if(error) {
				message = error;
				success = false;
			}
			else {
				if(response.statusCode === 200) {
					// ---------------------------------------------
					// Parse the response into json so we can extract
					// the data
					// ---------------------------------------------
					parseString(body, {trim:true, explicitArray: false}, function(err, result) {
						if(!err) {
							message = result.response.message;
							success = result.response.success;
							// ---------------------------------------------
							// Retrieve the "script" array
							// ---------------------------------------------
							scripts = result.response.data.initstatus.script;

							// ---------------------------------------------
							// Since the message property of each script is
							// itself an object, stringify all of those values
							// ---------------------------------------------
							for (var i = scripts.length; i--; ) {
								scripts[i].message = JSON.stringify(scripts[i].message);
							};
						}
						else {
							message = "Error parsing response! Error was: " + err + ". Body of response was " + body;
							success = false;
						}
					});
				}
				else {
					message = response.statusCode + " Error! Could not reach " + clientConf.appRoutes.initstatus;
				}
			}
			res.render("deploy/initStatus", {message: message, success: success, scripts: scripts});

		}
	);
		
	
};