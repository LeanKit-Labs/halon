var mocks = {
	"http://localhost:8088/analytics/api": require( "./mockResponses/options.json" ),
	"/analytics/api": require( "./mockResponses/options.json" ),
	"http://localhost:8088/analytics/altapi": require( "./mockResponses/altOptions.json" ),
	"/analytics/api/board/101": require( "./mockResponses/board101.json" ),
	"/analytics/api/board/101/card": require( "./mockResponses/board101cards.json" ),
	"/analytics/api/board/101/user": require( "./mockResponses/board101users.json" ),
	"/analytics/api/board/101/cardtype": require( "./mockResponses/board101cardtypes.json" ),
	"/analytics/api/user/1": require( "./mockResponses/user1.json" ),
	"/analytics/api/board/101/lane": require( "./mockResponses/board101lane.json" ),
	"/analytics/api/board/101/lane/307": {}
};
var when = require( "when" );
var adapter = function( resultsArray ) {
	return function( link, data ) {
		resultsArray.push( arguments );
		var res;
		res = mocks[ link.href ];
		return when( res )
			.then( function( resp ) {
				if ( resultsArray ) {
					resultsArray.push( resp );
				}
				return when( res );
			} );
	};
};

module.exports = adapter;
