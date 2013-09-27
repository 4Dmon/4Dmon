var valise = require( "valise" )
	, _ = require( "underscore" )
	, chart
	, parseNum
	;

exports.getConfig = function( req, res ) {
	res.type( "application/json" );

	var chartType = req.query.type || "line"
		, trackerId = req.params.tracker
		, tracker = valise( "trackers:" + trackerId )
		, logUtil = valise( "lib:log-util" )
		, stats = tracker.getStats()
		, statId = req.query.stat
		, getStatLogger = valise( "lib:trackers-util" ).getStatLogger
		, statObj
		, i
		;

	if( !statId ) {
		statObj = stats[0];
		statId = statObj.id;
	}

	if( !statId ) {
		res.end(JSON.stringify({
			error: true,
			message: "4dmon could not determine which stat you want to chart... whelp."
		}));
		return;
	}

	if( typeof statObj === "undefined" ) {
		for( i = stats.length; i--; ) {
			if( stats[i].id === statId ) {
				statObj = stats[i];
			}
		}
	}

	if( !statObj ) {
		res.end(JSON.stringify({
			error: true,
			message: "4dmon could not find an exposed stat object for: " + statId + " in tracker: " + trackerId + "."
		}));
		return;
	}

	getStatLogger( trackerId, statId ).query({rows: 1000, order: "asc"}, function( err, results ) {
		var logs = results.file;

		// Don't include erros for charting purposes
		logs = _.where( logs, {
			level: "info"
		});

		if( !logs.length ) {
			res.end( JSON.stringify({
				error: true,
				message: "4dmon could not dig up any logs for your stat... frowne towne :("
			}));
			return;
		}

		res.end( JSON.stringify(
			chart(
				chartType,
				trackerId + " - " + statObj.name,
				_.pluck( logs, "timestamp" ),
				[{
					name: statObj.name,
					data: _.zip(
						_.pluck( logs, "timestamp" ),
						_.pluck( logs, "message" ).map( parseNum )
					)
				}]
			)
		));

	});


};

// -----------------------------------------------------
// Convert a numeric string to a float, i.e.
// "$5,430 K" --> 5430000
// -----------------------------------------------------
parseNum = function( str ) {
	var numStr = str
		, num
		, suff
		, multiplier = 1
		;

	// Strip away commas
	numStr = numStr.replace( ",", "" );

	// Get rid of prefix
	numStr = numStr.replace( /^[^\d]*/, "" );

	// Grab suffix - and remove it from the numstr
	suff = numStr.replace( /^[\d.]*/, "" );
	numStr = numStr.replace( suff, "" );
	suff = suff.trim().toLowerCase();

	// Does our
	multiplier =
		suff === "k" ? 1000 :
		suff === "m" ? 1000000 :
		suff;

	num = Number( numStr );

	if( isNaN( num ) ) {
		// Hmmm... punt?
		num = parseInt( str, 10 );
	} else {
		num = num * multiplier;
	}

	return num;

};

// -----------------------------------------------------
// Return a boilerplate chart config
// -----------------------------------------------------
chart = function( type, title, categories, series ) {
	return {
		chart: {
			type: type
		},
		title: {
			text: title
		},
		series: series,
		//xAxis: {
		//	categories: categories
		//},
		yAxis: {
			title: {
				text: "Umm... Y-values?"
			}
		},
		credits: {
			enabled: false
		}
	};
};
