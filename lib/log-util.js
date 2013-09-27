// -----------------------------------------------------
// Filter
// - - -
// Meant to narrow down an array of log items based on a given set of filters
// -----------------------------------------------------
module.exports.filter = function( items, filters ) {
	var hasItems = items && items.length
		, i, j
		;

	// -----------------------------------------------------
	// If we don't have any items just return an empty array
	// -----------------------------------------------------
	if( !hasItems ) {
		return [];
	}

	// -----------------------------------------------------
	// Make sure we actually have some filters to work (array)
	// -----------------------------------------------------
	filters = filters || {};
	if( !( filters instanceof Array ) ) {
		filters = [filters];
	}

	items = items.filter( function( item ) {

		var filterKeys;
		for( i = filters.length; i--; ) {
			filterKeys = Object.keys( filters[i] );
			for( j = filterKeys.length; j--; ) {
				if( filters[i][filterKeys[j]] instanceof RegExp ) {
					if( !filters[i][filterKeys[j]].test( item[filterKeys[j]] ) ) {
						return false;
					}
				} else {
					if( filters[i][filterKeys[j]] !== item[filterKeys[j]] ) {
						return false;
					}
				}
			}
		}
		return true;
	});

	// -----------------------------------------------------
	// Return the final set of items we've whittled down to
	// -----------------------------------------------------
	return items;

};
