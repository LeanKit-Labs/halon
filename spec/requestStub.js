module.exports = function( adapterStub ) {
	var junk = [];
	var req = {
		appended: junk,
		form: function() { return this; },
		append: function() {
			junk.push( Array.prototype.slice.call( arguments ) );
		}
	};
	return function request( opts, cb ) {
		request.state = req;
		adapterStub( { href: opts.url }, opts.body )
			.then( function( res ) {
				cb( null, null, JSON.stringify( res ) );
			} );
		return req;
	};
};