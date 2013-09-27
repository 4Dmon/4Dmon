/**
 * Router map
 */

var valise = require( "valise" )
	, index = valise( "routes:index" )
	, fourd = valise( "routes:4d" )
	, fourdServer = valise( "routes:4d/server" )
	, fourdClient = valise( "routes:4d/client" )
	, snapshot = valise( "routes:snapshot" )
	, deploy = valise( "routes:deploy" )
	, doc = valise( "routes:doc" )
	, option = valise( "routes:option" )
	, jtr = valise( "routes:test/jtr" )
	, hc = valise( "routes:highcharts" )
	, monitor = valise( "routes:monitor" )
	;

module.exports = function( app ) {

	app.get( "/", index.home );

	app.get( "/4d", fourd.index );

	app.get( "/4d/backup/:folder", fourd.backup );
	app.get( "/4d/backup", fourd.backup );

	app.get( "/4d/server/execScript/:action", fourdServer.execScript );
	app.get( "/4d/server/info", fourdServer.info );
	app.get( "/4d/server/backup", fourdServer.backup );
	app.get( "/4d/server/build", fourdServer.build );
	app.get( "/4d/server/stop", fourdServer.stop );
	app.get( "/4d/server/start", fourdServer.start );

	app.get( "/4d/client/execScript/:action", fourdClient.execScript );
	app.get( "/4d/client/info", fourdClient.info );
	app.get( "/4d/client/backup", fourdClient.backup );
	app.get( "/4d/client/deployscripts", fourdClient.deployscripts );
	app.get( "/4d/client/stop", fourdClient.stop );
	app.get( "/4d/client/start", fourdClient.start );

	app.get( "/snapshot", snapshot.index );
	app.get( "/snapshot/:tracker", snapshot.trackerValue );

	app.get( "/4d/folder/:folder", fourd.folder );

	app.get( "/doc", doc.index );
	app.get( "/doc/:tracker", doc.index );

	app.get( "/deploy/initScripts", deploy.initScripts );
	app.get( "/deploy/initStatus", deploy.initStatus );

	app.get( "/option", option.index );
	app.get( "/option/save", option.formSubmit );
	app.get( "/option/checkBadness", option.checkBadness );
	app.get( "/option/setCheckBadness/:value", option.setCheckBadness );

	app.get( "/monitor/start", monitor.startMonitor );
	app.get( "/monitor/stop", monitor.stopMonitor );
	app.get( "/monitor/check", monitor.monitorListening );

	app.get( "/restart", function( req, res ) {
		process.nextTick( require( "evolver" ).restart );
		res.end( "restarting..." );
	});

	// Charting
	app.get( "/tracker/:tracker/chart", hc.getConfig );

	app.get( "*", function( req, res ) {
		res.render( "404" );
	});

	// -----------------------------------------------------
	// Testing routes
	// -----------------------------------------------------
	//app.get( "/test/jtr", jtr.jtr );
	//app.get( "/test/jtr2", jtr.jtr2 );

};
