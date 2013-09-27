// ---------------------------------------------
// When the button is clicked, make an AJAX
// call to get the button, then show it in the
// page
// ---------------------------------------------
$("#screenshotButton").click(function() {

	// ---------------------------------------------
	// Make the loading image visible
	// ---------------------------------------------
	$("#screenshot").show();

	var filepaths = []
		, names = []
		, i
		, j
		;

	$.ajax({
		url: "/snapshot/picmon"
	}).done(function(json){

		// ---------------------------------------------
		// Response JSON looks like this.
		// value will be "N/A" if that picture was not taken
		// {
		//    data: [
		//       {
		//          name: "Client Screenshot"
		//          value: <File path>
		//       },
		//       {
		//          name: "Desktop Screenshot"
		//          value: <File path>
		//       },
		//       {
		//          name: "Server Screenshot"
		//          value: <File path>
		//       }
		//    ]
		// }
		// ---------------------------------------------

		// ---------------------------------------------
		// Accumulate the data into arrays
		// ---------------------------------------------
		for(j = json.data.length - 1; j >= 0; j--) {
			names.push(json.data[j].name);
			filepaths.push(json.data[j].value);
		}

		// ---------------------------------------------
		// Cycle through the screenshots we need to display
		// ---------------------------------------------
		for (i = names.length - 1; i >= 0; i--) {
			
			// ---------------------------------------------
			// Remove whitespace from the name so that it matches
			// the IDs of divs on the page
			// ---------------------------------------------
			names[i] = names[i].replace(/\s/g,"");

			// ---------------------------------------------
			// If there is a filepath, make the div visible
			// and add the screenshot path to it.
			// ---------------------------------------------
			if(filepaths[i] !== "N/A") {
				$("#" + names[i]).show();
				filepaths[i] = filepaths[i].replace(/\\/g,"/"); // Change backslashes to forward slashes
				filepaths[i] = filepaths[i].split("/public")[1]; // Get everything after /public/
				$("#" + names[i] + " img").attr("src", filepaths[i]);
			}
		}
	});
		 
});
