(function( $ ) {

	$( function() {
		$( ".tracker-value" ).each( function( ix, el ) {
			var $el = $(el)
				, tpl = $("#tracker-value-tpl").html()
				, trackerId = ( $el.attr( "data-tracker" ) )
				;

			//$el.load( "/snapshot/" + trackerId );

			$.ajax( "/snapshot/" + trackerId, {
				dataType: "json",
				success: function( resp ) {
					$el.empty();
					resp.data.forEach( function( robj ) {
						$el.append(
							tpl.replace( "{{name}}", robj.name )
								.replace( "{{value}}", robj.value )
						);
					});
				},
				error: function() {
					// [todo]
					console.log( "Error!" );
				}
			});

		});
	});

}( jQuery ));
