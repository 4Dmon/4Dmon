
"use strict";

require( "../../../init/valise" );

var valise = require( "valise" )
	, logUtil = valise( "lib:log-util.js" )
	, filter = logUtil.filter;

valise.mixin({
	"fixture": __dirname + "/fixtures/filter"
});

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

exports["log-util test"] = {
  setUp: function( done ) {
    // setup here
    done();
  },

	"result is as expected": function( test ) {
		test.expect( 5 ); // Not necessary for sync test... but good habit anyway

		var json1 = valise( "fixture:filter-test1.json" )
			, json2 = valise( "fixture:filter-test2.json" )
			, json3 = valise( "fixture:filter-test3.json" )
			, json4 = valise( "fixture:filter-test4.json" )
			;

		test.equal(
			JSON.stringify( filter( json1.items, json1.filters ) ),
			JSON.stringify( json1.expected ),
			"[Test1] Filtered results should match expected"
		);

		test.equal(
			JSON.stringify( filter( json2.items, json2.filters ) ),
			JSON.stringify( json2.expected ),
			"[Test2] Filtered results should match expected"
		);

		test.equal(
			JSON.stringify( filter( json3.items, json3.filters ) ),
			JSON.stringify( json3.expected ),
			"[Test3] Filtered results should match expected"
		);

		test.equal(
			JSON.stringify( filter( json4.items, json4.filters ) ),
			JSON.stringify( json4.expected ),
			"[Test4] Filtered results should match expected"
		);

		test.equal(
			JSON.stringify( filter( json4.items, { "foo": /^bar$/ } ) ),
			JSON.stringify( [{ "foo": "bar", "super": "blargus" }] ),
			"[Test5] Filtered results should match expected"
		);

		test.done();
	}

};
