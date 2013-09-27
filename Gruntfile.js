"use strict";

var fs = require( "fs" )
	, path = require( "path" )
	, os = require( "os" )
	;

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		// ---------------------------------------------
		// Unit tests
		// ---------------------------------------------
		nodeunit: {
			unit: ["test/unit/**/*_test.js"],
			integration: ["test/integration/**/*_test.js"]
		},

		// ---------------------------------------------
		// Linting with JSHint
		// ---------------------------------------------
		jshint: {
			options: {
				jshintrc: ".jshintrc"
			},
			gruntfile: {
				src: "Gruntfile.js"
			},
			app: {
				src: [
					"app.js",
					"init/**/*.js",
					"lib/**/*.js",
					"monitor/**/*.js",
					"trackers/**/*.js"
				]
			},
			clientside: {
				src: ["public/javascripts/**/*.js"]
			},
			tests: {
				src: ["test/**/*.js"]
			}
		},

		// ---------------------------------------------
		// Clean out the dist configs
		// ---------------------------------------------
		clean: {
			configs: ['dist']
		},

		// ---------------------------------------------
		// Concatenate all the conf files into one
		// ---------------------------------------------
		concat: {
			configs: {
				src: ['conf/**/*.yml'],
				dest: 'dist/config.yml'
			}
		},

		// ---------------------------------------------
		// Convert yaml into JSON
		// ---------------------------------------------
		yaml: {
			options: { space: 2 },
			configs: {
				src: 'dist/config.yml',
				dest: 'dist'
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( "grunt-contrib-nodeunit" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-contrib-clean" );
	grunt.loadNpmTasks( "grunt-contrib-concat" );
	grunt.loadNpmTasks( "grunt-yaml" );

	// -----------------------------------------------------
	// Build an index.md file to link to each of our trackers
	// -----------------------------------------------------
	grunt.registerTask( "tracker-doc", function() {
		var paths = fs.readdirSync( __dirname + "/trackers" )
			, mdLinks = []
			;

		paths.forEach( function( p ) {
			var trkr = p.replace( ".js", "" );
			mdLinks.push( "* [" + trkr + "](/doc/" + trkr + ")" + os.EOL );
		});

		fs.writeFileSync( __dirname + "/doc/index.md",
			fs.readFileSync( __dirname + "/doc/.parts/header.md" ) +
			mdLinks.join( "" ) +
			fs.readFileSync( __dirname + "/doc/.parts/footer.md" )
		);

		grunt.log.ok( "Tracker README file built" );

	});

	// Default task.
	grunt.registerTask( "default", [
		"jshint",
		"nodeunit:unit",
		"tracker-doc"
	]);

	// ---------------------------------------------
	// Build the main config.json file
	// ---------------------------------------------
	grunt.registerTask( "config", [
		"clean",
		"concat",
		"yaml"
	]);
};
