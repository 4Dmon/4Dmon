var io = require( "socket.io" )
	, valise = require("valise")
	, nconf = valise("lib:config-util").nconf
	, socketUtil = valise("lib:socket-util")
	, isArray = require("util").isArray
	;

exports.index = function( req, res ) {

	var query = req.query
		, val
		, numberRegEx = /^[0-9]+$/
		;

	// Save form inputs
	if(query) {
		// ---------------------------------------------
		// Iterate through every field in the query params,
		// adjust it to the proper form if necessary, and
		// set it in nconf.
		// ---------------------------------------------
		for (key in query) {
			val = query[key];

			// ---------------------------------------------
			// This is a little funky. For boolean values, the
			// form uses checkboxes, which don't submit when
			// unchecked. To handle this there is a hidden input
			// of the same name as each check box with the value false.
			// If the 'actual' checkbox is unchecked, then only
			// the hidden value gets sent in response:
			//   e.g. CHECK_BADNESS = false
			// If the checkbox is checked however, both its value
			// and the value of the hidden input are sent, resulting in
			//   e.g. CHECK_BADNESS = [true,false]
			// Other server languages may perform differently,
			// but this is the result using nodejs and express.
			// The latter we want to switch back to just 'true'.
			// ---------------------------------------------
			if(isArray(val) && val[0] === 'true') {
				val = true;
			}
			// Convert string 'false' back into a boolean
			else if(val === 'false') {
				val = false;
			}
			// Convert number strings back into numbers
			else if(numberRegEx.test(val)) {
				val = parseInt(val);
			}
			// Convert arrays back into their proper form
			else if(key.indexOf("<arr>") !== -1) {
				// The <arr> was on the key just to identify this as an array,
				// we should remove it now.
				key = key.substring(0, key.length - 5);
				val = val.split("\r\n");
			}

			console.log(key + " - " + val);

			// ---------------------------------------------
			// Because of how we set up the form, the name
			// of each input is also its key into nconf
			//  e.g. email:sender:name
			// ---------------------------------------------
			nconf.set(key, val);
		}

		// ---------------------------------------------
		// Save the resulting configuration to file
		// ---------------------------------------------
		nconf.save();
	}

	res.render( "option/index", { conf: nconf.get() } );
}

exports.checkBadness = function( req, res ) {
	res.end(process.env.CHECK_BADNESS);
}

exports.setCheckBadness = function( req, res ) {
	process.env.CHECK_BADNESS = req.params.value;
	// ---------------------------------------------
	// Let any listening socket connections know that
	// this variable has changed
	// ---------------------------------------------
	socketUtil.emitBadnessChecking(process.env.CHECK_BADNESS);

	res.end("CHECK_BADNESS has been set to " + process.env.CHECK_BADNESS);
}