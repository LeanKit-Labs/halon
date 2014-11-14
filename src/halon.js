/* global require, module */
/* jshint -W098 */
( function( root, factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "machina", "lodash", "when", "URIjs", "URITemplate" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = factory(
			require( "machina" ),
			require( "lodash" ),
			require( "when" ),
			require( "URIjs" ),
			require( "URIjs/src/URITemplate" )
		);
	} else {
		throw new Error( "Sorry - halon only supports AMD or CommonJS module environments." );
	}
}( this, function( machina, _, when, URI, URITemplate ) {

	var _defaultAdapter;

	function expandLink( action, data ) {
		var href = URI.expand( action.href, data ).href();
		var query = data[ "?" ];
		if( query ) {
			href = href + "?" + _.map( query, function( val, param ) { 
				return param + "=" + URI.encode( val ); 
			} ).join( "&" );
			delete data[ "?" ];
		} else if( action.parameters ) {
			href = href + "?" + _.compact( _.map( action.parameters, function( param, key ) {
				if( data[ key ] ) {
					return key + "=" + URI.encode( data[ key ] );
				}
			} ) ).join( "&" );
		}
		return href;
	}

	function invokeResource( fsm, key, data, headers ) {
		data = data || {};
		headers = headers || {};
		return when.promise( function( resolve, reject ) {
			fsm.handle(
				"invoke.resource",
				this,
				key,
				data,
				headers,
				resolve,
				reject
			);
		}.bind( this ) );
	}

	function processResponse( response, fsm ) {
		// detect whether or not a top-level list of collections has been returned
		if( !response._links ) {
			var listKey = Object.keys( response )
				.filter( function( x ) { 
					return x !== "_origin";
				} )[0];
			var base = { _origin: response._origin };
			base[ listKey ] = _.map( response[ listKey ], function( item ) {
				return processEmbedded( processLinks( item, fsm ) );
			} );
			return base;
		} else {
			return processEmbedded( processLinks( response, fsm ) );
		}
	}

	function processEmbedded( response ) {
		if ( response._embedded ) {
			_.each( response._embedded, function( value, key ) {
				processEmbedded( value );
				response[ key ] = value;
			} );
			delete response._embedded;
		}
		return response;
	}

	function processLinks( options, fsm ) {
		var actions = options._actions = {};
		_.each( options._links, function( linkDef, relKey ) {
			var splitKey = relKey.split( ":" );
			var rel = relKey;
			var target = actions;
			if ( splitKey.length === 2 ) {
				target = actions[ splitKey[ 0 ] ] = ( actions[ splitKey[ 0 ] ] || {} );
				rel = splitKey[ 1 ];
			}
			target[ rel ] = invokeResource.bind( options, fsm, relKey );
		} );
		return options;
	}

	function processKnownOptions( knownOptions ) {
		var x = _.reduce( knownOptions, function( memo, rels, resource ) {
			rels.forEach( function( rel ) {
				memo._links[ resource + ":" + rel ] = {};
			} );
			return memo;
		}, { _links: {} } );
		return x;
	}

	var HalonClientFsm = machina.Fsm.extend( {

		initialize: function( options ) {
			_.extend( this.client, processLinks(
				processKnownOptions( options.knownOptions ),
				this
			) );
		},

		states: {
			uninitialized: {
				"start": "initializing",
				"invoke.resource": function() {
					this.deferUntilTransition( "ready" );
				}
			},
			initializing: {
				_onEnter: function() {
					this.adapter( { href: this.root, method: "OPTIONS" }, { headers: this.getHeaders(), server: this.server } )
						.then(
							this.handle.bind( this, "root.loaded" ), function( err ) {
								console.warn( err );
							}
					);
				},
				"root.loaded": function( options ) {
					_.merge( this.client, processLinks( options, this ) );
					this.transition( "ready" );
				},
				"invoke.resource": function() {
					this.deferUntilTransition( "ready" );
				}
			},
			ready: {
				"invoke.resource": function( resource, rel, data, headers, success, err ) {
					var resourceDef = resource._links[ rel ];
					if ( !resourceDef ) {
						throw new Error( "No link definition for rel '" + rel + "'" );
					}
					if ( resourceDef.templated || resourceDef.parameters || data[ '?' ] ) {
						resourceDef = _.extend( {}, resourceDef, { href: expandLink( resourceDef, data ) } );
					}
					this.adapter( resourceDef, { data: data, headers: this.getHeaders( headers ), server: this.server } )
						.then( function( response ) {
							return when.promise( function( resolve, reject ) {
								if ( !response ) {
									var err = new Error( "Empty response for " + rel );
									err.resourceDef = resourceDef;
									reject( err );
								}
								resolve( processResponse( response, this ) );
							}.bind( this ) );
						}.bind( this ) )
						.then( success, err );
				}
			}
		},

		getHeaders: function( hdrs ) {
			return _.extend( {}, this.headers, ( hdrs || {} ), { Accept: "application/hal.v" + this.version + "+json" } );
		}
	} );

	var defaults = {
		version: 1,
		knownOptions: {},
		adapter: _defaultAdapter,
		headers: {}
	};

	var halonFactory = function( options ) {
		var client = function halonInstance() {
			var args = Array.prototype.slice.call( arguments, 0 );
			return when.all( args );
		};
		options = _.defaults( options, defaults );
		var server = /http(s)?[:][\/]{2}[^\/]*/.exec( options.root );
		options.server = server ? server[ 0 ] : undefined;
		options.client = client;

		var fsm = client.fsm = new HalonClientFsm( options );

		client.onReady = function( cb ) {
			if ( fsm.state === "ready" ) {
				cb( client );
			} else {
				var listener;
				listener = fsm.on( "transition", function( data ) {
					if ( data.toState === "ready" ) {
						listener.off();
						cb( client );
					}
				}.bind( this ) );
			}
			return client;
		};

		client.start = function() {
			fsm.handle( "start" );
		};

		if ( !options.doNotStart ) {
			setTimeout( function() {
				client.start();
			}, 0 );
		}

		return client;
	};

	halonFactory.defaultAdapter = function( adapter ) {
		_defaultAdapter = adapter;
		return halonFactory;
	};

	halonFactory.jQueryAdapter = function( $ ) {
		return function( link, options ) {
			return $.ajax( {
				url: link.href,
				type: link.method,
				headers: options.headers,
				dataType: "json",
				data: options.data
			} );
		};
	};

	halonFactory.requestAdapter = function( request ) {
		return function( link, options ) {
			var json = _.isString( options.data ) ? 
				options.data : 
				JSON.stringify( options.data );
			var url = link.href.indexOf( options.server ) < 0 ?
				options.server + link.href :
				link.href;
			return when.promise( function( resolve, reject ) {
				request( {
					url: url,
					method: link.method,
					headers: options.headers,
					body: json,
				}, function( err, resp, body ) {
					if( err ) {
						reject( err );
					} else {
						resolve( JSON.parse( body ) );
					}
				} );
			} );
		};
	};

	return halonFactory;

} ));