// -----------------------------------------------------
// Hook for simple stat charts
// - - -
// Include an element on the page with these attributes:
// class: stat-chart
// data-tracker: *trackerId*
// data-stat: *statId*
// Example
//   .stat-chart( data-tracker="memmon", data-stat="memmon_client_memory" )
// -----------------------------------------------------
(function( $ ) {
	$( document ).ready( function() {
		$(".stat-chart").each( function( ix ) {
			var $self = $(this)
				, tracker = $self.attr( "data-tracker" )
				, stat = $self.attr( "data-stat" )
				;

			$.get( "/tracker/" + tracker + "/chart", {stat: stat}, function( data ) {
				if( !data.error ) {
					data.chart.renderTo = $self[0];
					var chartTmp = new Highcharts.Chart( data );
				} else {
					$self.html(
						"<div class='alert'><strong>Whoops!</strong><br />" +
						"<em>" + tracker + " - " + stat + "</em><br />" +
						"<p style='font-size:smaller'>" + data.message + "</p></div>" );
				}
			});
		});
	});
}( jQuery ));
