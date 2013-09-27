// -----------------------------------------------------
// Turns the monitor process on and off based when the user
// hits the toggle in the nav bar
// -----------------------------------------------------
$( document ).ready( function() {
	$.ajax({
		url: "/monitor/check",
		success: function (body) {
			// ---------------------------------------------
			// body will either be true or false depending
			// on whether or not the monitor is running.
			// ---------------------------------------------
			if(body === "true") {
				$('#monitorSwitch').bootstrapSwitch('setState', true);
			}
			else {
				$('#monitorSwitch').bootstrapSwitch('setState', false);
			}

			// ---------------------------------------------
			// After initializing
			// ---------------------------------------------
			$('#monitorSwitch').on('switch-change', function(e, data) {
				var $el = $(data.el)
					, value = data.value;

				// ---------------------------------------------
				// true - turn on the monitor process
				// ---------------------------------------------
				if(value) {
					$.ajax({
						url: "/monitor/start",
						success: function() {
							console.log("started the monitor");
						}
					});
				}
				// ---------------------------------------------
				// false - turn off the monitor process
				// ---------------------------------------------
				else {
					$.ajax({
						url: "/monitor/stop",
						success: function() {
							console.log("stopped the monitor");
						}
					});
				}
			});
		}
	})
	
});

