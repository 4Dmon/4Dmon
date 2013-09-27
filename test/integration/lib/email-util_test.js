
"use strict";

require( "../../../init/valise.js" );

var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, emailUtil = valise( "lib:email-util" )
	, emailConf = nconf.get( "email")
	, _ = require( "underscore" )
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

exports["email-util test"] = {

	setUp: function( done ) {
		// setup here
		done();
	},

	"transport types execute": function( test ) {

		test.expect( 3 ); // Not necessary for sync test... but good habit anyway

		var done = _.after( 3, test.done );

		// -----------------------------------------------------
		// Test Sendgrid service.
		// -----------------------------------------------------
		test.doesNotThrow(function() {
				emailUtil.send( 'sendgrid', {
					to:      emailConf.recipients.WATCHDOG_ERROR,
					from:    emailConf.sender.name + " <" + emailConf.sender.email + ">",
					subject: "[Test] 4dmon testing. Please ignore.",
					text:    "Please login and address the issue."
				}, done);
			},
			"Sendgrid service should work!"
		);

		// -----------------------------------------------------
		// Test Gmail service.
		// -----------------------------------------------------
		test.doesNotThrow(function() {
				emailUtil.send( 'gmail', {
					to:      emailConf.recipients.WATCHDOG_ERROR,
					from:    emailConf.sender.name + " <" + emailConf.sender.email + ">",
					subject: "[Test] 4dmon testing. Please ignore.",
					text:    "Please login and address the issue."
				}, done);
			},
			"Gmail service should work"
		);

		// -----------------------------------------------------
		// Test *unknown* service.
		// -----------------------------------------------------
		test.doesNotThrow(function() {
				emailUtil.send( 'blargus', {
					to:      emailConf.recipients.WATCHDOG_ERROR,
					from:    emailConf.sender.name + " <" + emailConf.sender.email + ">",
					subject: "[Test] 4dmon testing. Please ignore.",
					text:    "Please login and address the issue."
				}, done);
			},
			"Unkown service souldn't work"
		);
	}

};
