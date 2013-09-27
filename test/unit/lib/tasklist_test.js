"use strict";

require( "../../../init/valise" );

var fs = require( "fs" )
	, cp = require( "child_process" )
	, _ = require( "underscore" )
	, async = require( "async" )
	, valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, tasklist = valise( "lib:tasklist.js" )
	, sconf = nconf.get( "4dserver" )
	, cconf = nconf.get( "4dclient" )
	, processDetails = tasklist.processDetails
	;

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports["tasklist test"] = {
  setUp: function( done ) {
    // setup here
    done();
  },

	"results are as expected": function( test ) {
		var tl1 = fs.readFileSync( __dirname + "/fixtures/tasklist/tasklist-none.txt", "utf8" )
			, tl2 = fs.readFileSync( __dirname + "/fixtures/tasklist/tasklist-client.txt", "utf8" )
			, tl3 = fs.readFileSync( __dirname + "/fixtures/tasklist/tasklist-server.txt", "utf8" )
			, serr = "Error: " + sconf.processName + " is not running"
			, cerr = "Error: " + cconf.processName + " is not running"
			, execForReal = cp.exec // Save this so we can restore it later
			, execHighjack
			, done
			;

		test.expect( 8 );

		// -----------------------------------------------------
		// The tasklist command makes uses cp.exec... we're going to hijack cp.exec
		// to fake systems calls
		// -----------------------------------------------------
		execHighjack = function( out ) {
			cp.exec = function( cmd, cb ) {
				cb( null, out, "" );
			};
		};

		// -----------------------------------------------------
		// Run our actual tests, these must be run in series since we change the
		// behavior of cp.exec for each batch of tests
		// -----------------------------------------------------
		async.series([
			// -----------------------------------------------------
			// Our tl1 tests
			// -----------------------------------------------------
			function( cb ) {
				var done = _.after( 2, cb );

				// Doesn't find anything!
				execHighjack( tl1 );
				processDetails( sconf.processName, function( error, data ) {
					test.equal(
						data,
						null,
						"tl1 - Should not find process: " + sconf.processName
					);

					test.equal(
						error.toString(),
						serr,
						"tl1 - Should should have an error"
					);
					done();
				});

				processDetails( cconf.processName, function( error, data ) {
					test.equal(
						data,
						null,
						"tl1 - Should not find process: " + cconf.processName
					);

					test.equal(
						error.toString(),
						cerr,
						"tl1 - Should have an error"
					);
					done();
				});
			},

			// -----------------------------------------------------
			// Our tl2 tests
			// -----------------------------------------------------
			function( cb ) {
				var done = cb;

				// Client only
				execHighjack( tl2 );
				processDetails( cconf.processName, function( error, data ) {
					test.deepEqual(
						data,
						{
							"imageName": cconf.processName,
							"processID": "124",
							"sessionName": "Console",
							"sessionNumber": "1",
							"memoryUsage": "89,868 K"
						},
						"tl2 - Should find process " + cconf.processName
					);

					test.equal(
						error,
						null,
						"tl2 - Should not have an error"
					);
					done();
				});
			},

			// -----------------------------------------------------
			// tl3 test
			// -----------------------------------------------------
			function( cb ) {
				var done = cb;

				// Server only
				execHighjack( tl3 );
				processDetails( sconf.processName, function( error, data ) {
					test.deepEqual(
						data,
						{
							"imageName": sconf.processName,
							"processID": "5772",
							"sessionName": "Console",
							"sessionNumber": "1",
							"memoryUsage": "78,656 K"
						},
						"tl2 - Should find process: " + sconf.processName
					);

					test.equal(
						error,
						null,
						"tl3 - Should not have an error"
					);
					done();
				});
			}
		], // Finish series array

		// -----------------------------------------------------
		// When we're finally done go ahead and complete the task (also restore
		// cp.exec in case it's used elsewhere in this process)
		// -----------------------------------------------------
		function() {
			cp.exec = execForReal;
			test.done();
		});
	}

};
