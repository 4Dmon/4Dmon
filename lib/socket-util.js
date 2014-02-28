// ---------------------------------------------
// socket-util.js--
// Maintains a pool of all socket connections
// so that we can send events out to them.
//
// Events that can be emitted:
//   emitBadnessChecking - lets client connections know that
//                         the CHECK_BADNESS env variable has
//                         changed
//
//   emitKill - a request for listening clients
//   to kill their processes
// ---------------------------------------------

exports.pool = [];

exports.emitBadnessChecking = function(check) {
	this.pool.forEach(function(socket) {
		socket.emit('checkBadness', check);
	});
};

exports.emitKill = function() {
	this.pool.forEach(function(socket) {
		socket.emit('die', true);
	});
	this.pool = []; // Reset the pool of connections
};

exports.totalConnections = function() {
	return this.pool.length;
};
