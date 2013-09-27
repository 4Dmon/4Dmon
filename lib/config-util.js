// ---------------------------------------------
// This provides a central location in which our
// nconf is stored with all the necessary configuration
// so that it can be used from anywhere.
// ---------------------------------------------

exports.nconf = require( "nconf" ).file('dist/config.json');