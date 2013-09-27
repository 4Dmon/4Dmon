// ---------------------------------------------
// When the form has been submitted, show the
// alert indicating success.
// ---------------------------------------------
$(document).ready(function() {
	// If there is a query string, this form was submitted
	if(location.search) {
		$("#savedAlert").show();
	}
});