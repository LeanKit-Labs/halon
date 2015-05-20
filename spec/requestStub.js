module.exports = function( adapterStub ) {
	var junk = [];
	var req = {
	};
	return function request( opts, cb ) {
		request.state = req;
		adapterStub( { href: opts.url }, opts )
			.then( function( res ) {
				var body = "";
				var status = res.statusCode ? res.statusCode : 200;
				delete res.statusCode;
				if ( res ) {
					body = _.isString( res ) ? res : JSON.stringify( res );
				}
				cb( undefined, { statusCode: status }, body );
			} )
			.catch( function( err ) {
				cb( err, null, null );
				return true;
			} );
		return req;
	};
};
