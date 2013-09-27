var valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, winston = require( "winston" )
	, mailer = require( "nodemailer" )
	, logger = winston.loggers.get( "watchdogLog" )
	, monitorConf = nconf.get( "monitor" ).interval
	, emailConf = nconf.get( "email" )
	, envConf = nconf.get( "env" )
	, SendGrid = require( "sendgrid" ).SendGrid
	, os = require( "os" )
	;


module.exports.send = function( service, email, cb ) {

	var auth, sendgrid, svcConf, matches, transport, callback;

	// -----------------------------------------------------
	// Make the callback optional
	// -----------------------------------------------------
	callback = function() {
		if( cb ) {
			cb();
		}
	};

	if( !emailConf.services[service] ) {
		logger.warn( "Whoa! 4dmon doesn't have a config option for this service type! Check ./conf/email.json to make sure it exists." );
		callback();
	} else {

		auth = emailConf.services[service].auth;
		svcConf = emailConf.services[service];

		// -----------------------------------------------------
		// SENDGRID
		// -----------------------------------------------------
		if( service === 'sendgrid' ) {

			// -----------------------------------------------------
			// Sendgrid doesn't like receiving the from address in
			// "name <email>" form. Split it up.
			// -----------------------------------------------------
			matches = email.from.match(/(.*)<(.*)>/);
			if(matches.length > 1){
				email.from = matches[1].trim() + "--" + os.hostname();
				email.fromName = matches[2].trim();
			}

			// ---------------------------------------------
			// Append the name of the machine that sent the
			// message to the email subject so we know whether
			// or not this is important or just testing.
			// ---------------------------------------------
			email.subject = "[" + os.hostname() + "] " + email.subject;

			sendgrid = new SendGrid( auth.username, auth.password );
			sendgrid.send( email, function( success, message) {
				if(!success) {
					logger.warn( message );
				}
				if( callback ) {
					callback();
				}
			} );

		}
		// -----------------------------------------------------
		// GMAIL
		// -----------------------------------------------------
		else if( service === 'gmail' ) {

			transport = mailer.createTransport( svcConf.transport, {
				service: svcConf.service,
				auth: {
					user: auth.username,
					pass: auth.password
				}
			});

			transport.sendMail( email, function( err, response ) {
				if( err ) {
					logger.warn( err );
				}
				transport.close();
				if( callback ) {
					callback();
				}
			});

		} else {

			logger.warn( "Whoa! 4dmon doesn't know how to send messages for this service type!" );

		}
	}
};
