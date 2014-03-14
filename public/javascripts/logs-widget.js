
(function( $ ) {
	$( document ).ready( function() {
		var logBox = $('#log-box')
		$.get( '/tracker/logmon/newLogs/', function(data) {
			if (!data.error) {
				logBox.find('textarea').text(data.logs.join('\n'));
			} else {
				logBox.text("There was a problem getting the logs..");
			}
		});
	});
}( jQuery ));
