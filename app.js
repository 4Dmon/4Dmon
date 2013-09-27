// -----------------------------------------------------
// Init routines
// -----------------------------------------------------
require( "./init" );

/**
 * Module dependencies.
 */

var valise = require( "valise" )
	, express = require( "express" )
  , routes = require( "./routes" )
  , http = require( "http" )
  , path = require( "path" )
  , nconf = valise( "lib:config-util" ).nconf
	, app = express()
  , appio = express()
  , socketio = require( "socket.io" )
  , socketUtil = valise( "lib:socket-util" )
  , monitorUtil = valise( "lib:monitor-util" )
  , envConf = nconf.get( "env" )
  , monitorConf = nconf.get( "monitor" )
  , ioserver
  , io
	;

// -----------------------------------------------------
// General app configuration
// -----------------------------------------------------
app.configure(function(){
  app.set( "port", process.env.PORT || envConf.port );
  app.set( "views", __dirname + "/views" );
  app.set( "view engine", "jade" );
  app.use( express.favicon() );
  app.use( express.logger("dev") );
  app.use( express.bodyParser() );
  app.use( express.methodOverride() );
  app.use( require("less-middleware")({ src: __dirname + "/public" }) );
  app.use( express["static"](path.join(__dirname, "public")) );
	app.use( valise( "lib:middleware" ).markdown );
  app.use( app.router );
});

// -----------------------------------------------------
// Development specific configs
// -----------------------------------------------------
app.configure( "development", function() {
  app.use( express.errorHandler() );
});

// ---------------------------------------------
// Set up environment variables
// ---------------------------------------------

process.env.CHECK_BADNESS = true; // Enable badness checking

// ---------------------------------------------
// Socket.io server
// ---------------------------------------------
ioserver = http.createServer( appio );
io = socketio.listen(ioserver);
io.set('log level', 2); // log error, warn, and info
ioserver.listen(envConf.socketPort);
io.sockets.on('connection', function(socket) {
  socketUtil.pool.push(socket);
  // Let this one socket know the current value of the CHECK_BADNESS variable
  socket.emit('checkBadness', process.env.CHECK_BADNESS);
});

// -----------------------------------------------------
// Offload our routing setup... could get longish
// -----------------------------------------------------
require( "./routes/_map" )( app );

// ---------------------------------------------
// Create a server listening on the specified port
// ---------------------------------------------
http.createServer( app ).listen( app.get( "port" ), function(){
  console.log( "Express server listening on port " + app.get( "port" ) );
});

// ---------------------------------------------
// Start the watchdog if 4dmon is configured to
// start the monitor on startup
// ---------------------------------------------
if(monitorConf.runOnStartup) {
  monitorUtil.startMonitor();
}