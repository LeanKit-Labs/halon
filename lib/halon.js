/**
 * halon - JavaScript Hypermedia Client
 * Author: LeanKit
 * Version: v0.3.3
 * Url: https://github.com/LeanKit-Labs/halon
 * License(s): MIT Copyright (c) 2015 LeanKit
 */


( function( root, factory ) {
	/* istanbul ignore next - Not testing the UMD */
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
		if ( query ) {
			href = href + "?" + _.map( query, function( val, param ) {
					return param + "=" + URI.encode( val );
				} ).join( "&" );
			delete data[ "?" ];
		} else if ( action.parameters ) {
			href = href + "?" + _.compact( _.map( action.parameters, function( param, key ) {
					if ( data[ key ] ) {
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
		// don't bother with all this if the response is an empty body
		if ( _.isEmpty( response ) || _.isString( response ) ) {
			return response;
		}
		// detect whether or not a top-level list of collections has been returned
		if ( !response._links ) {
			var listKey = Object.keys( response )
				.filter( function( x ) {
					return x !== "_origin";
				} )[ 0 ];
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
		var actions = options;
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
				memo._links[ resource + ":" + rel ] = undefined;
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
		followResourceLink: function( res, key, data, headers ) {
			return invokeResource.call( res, this, key, data, headers );
		},
		states: {
			uninitialized: {
				connect: "initializing",
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
								this.connectionError = err;
								this.transition( "connection.failed" );
							}.bind( this )
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
				_onEnter: function() {
					if ( this.client.deferred ) {
						this.client.deferred.resolve( this.client );
						this.client.deferred = undefined;
					}
				},
				"invoke.resource": function( resource, rel, data, headers, success, err ) {
					var resourceDef = resource._links[ rel ];
					if ( !resourceDef ) {
						throw new Error( "No link definition for rel '" + rel + "'" );
					}
					if ( resourceDef.templated || resourceDef.parameters || data[ "?" ] ) {
						resourceDef = _.extend( {}, resourceDef, { href: expandLink( resourceDef, data ) } );
					}
					if ( data.body ) {
						data = data.body;
					}
					this.adapter( resourceDef, { data: data, headers: this.getHeaders( headers ), server: this.server } )
						.then( function( response ) {
							return processResponse( response, this );
						}.bind( this ) )
						.then( success, err );
				}
			},
			"connection.failed": {
				_onEnter: function() {
					if ( this.client.deferred ) {
						this.client.deferred.reject( this.connectionError );
						this.client.deferred = undefined;
					}
				},
				connect: "initializing",
				"invoke.resource": function( resource, rel, data, headers, success, err ) {
					err( this.connectionError );
				}
			}
		},

		getHeaders: function( hdrs ) {
			return _.extend( {}, this.headers, ( hdrs || {} ), { Accept: "application/hal.v" + this.version + "+json" } );
		}
	} );

	var halonFactory = function( options ) {
		var defaults = {
			version: 1,
			knownOptions: {},
			adapter: _defaultAdapter,
			headers: {}
		};

		var client = function halonInstance() {
			var args = Array.prototype.slice.call( arguments, 0 );
			return when.all( args );
		};
		options = _.defaults( options, defaults );
		var server = /http(s)?[:][\/]{2}[^\/]*/.exec( options.root );
		options.server = server ? server[ 0 ] : undefined;
		options.client = client;

		var fsm = client.fsm = new HalonClientFsm( options );
		var listenFor = function( state, cb, persist ) {
			if ( fsm.state === state ) {
				cb( client );
			}
			var listener;
			listener = fsm.on( "transition", function( data ) {
				// this is necessary to ensure that the promise resolves
				// before invoking the event listener callback!
				process.nextTick( function() {
					if ( data.toState === state ) {
						if ( !persist ) {
							listener.off();
						}
						cb( client, fsm.connectionError, listener );
					}
				} );
			} );
		};

		client.followResourceLink = client.fsm.followResourceLink.bind( client.fsm );

		client.on = function( eventName, cb, persist ) {
			if ( eventName === "ready" ) {
				listenFor( "ready", cb, persist );
			} else if ( eventName === "rejected" ) {
				listenFor( "connection.failed", cb, persist );
			} else {
				throw new Error( "Only 'ready' and 'rejected' events are supported by this emitter." );
			}
			return client;
		};

		client.connect = function() {
			var pending = this.deferred && this.deferred.promise.inspect().state !== "fulfilled";
			if ( !pending ) {
				this.deferred = when.defer();
				fsm.handle( "connect" );
			}
			return this.deferred.promise;
		};

		if ( options.start ) {
			setTimeout( function() {
				client.connect().catch( function() {} );
			}, 0 );
		}

		return client;
	};

	halonFactory.defaultAdapter = function( adapter ) {
		_defaultAdapter = adapter;
		return halonFactory;
	};

	halonFactory.jQueryAdapter = function( $ ) {
		var autoStringify = [ "PATCH", "POST", "PUT" ];
		return function( link, options ) {
			var ajaxDef = {
				url: link.href,
				type: link.method,
				headers: options.headers,
				dataType: "json",
				data: options.data
			};

			if ( options.data && _.contains( autoStringify, link.method.toUpperCase() ) ) {
				ajaxDef.data = typeof options.data === "string" ? options.data : JSON.stringify( options.data );
				ajaxDef.contentType = "application/json";
			}

			return when.promise( function( resolve, reject ) {
				$.ajax( ajaxDef )
					.then( resolve, function( jqXhr, respText, e ) {
						var err = new Error( e );
						err.status = jqXhr.status;
						reject( err );
					} );
			} );
		};
	};

	halonFactory.requestAdapter = function( request ) {
		return function( link, options ) {
			var formData;
			if ( options.data && options.data.formData ) {
				formData = options.data.formData;
				delete options.data.formData;
			}
			var json = _.isString( options.data ) ?
				JSON.parse( options.data ) :
				options.data;
			var url = link.href.indexOf( options.server ) < 0 ?
				options.server + link.href :
				link.href;
			var requestOptions = {
				url: url,
				method: link.method,
				headers: options.headers
			};
			if ( formData ) {
				requestOptions.formData = formData;
			} else if ( json && !_.isEmpty( json ) ) {
				requestOptions.json = json;
				requestOptions.headers[ "Content-Type" ] = "application/json";
			}
			return when.promise( function( resolve, reject ) {
				request( requestOptions, function( err, resp, body ) {
					var json;
					if ( body && body[ 0 ] === "{" ) {
						var isJson = body && body !== "" && body !== "{}";
						json = isJson ? JSON.parse( body ) : {};
						json.status = resp.statusCode;
					} else if ( body ) {
						body.status = resp.statusCode;
					}
					if ( err ) {
						reject( err );
					} else if ( resp.statusCode >= 400 ) {
						reject( json || body );
					} else {
						resolve( json || body );
					}
				} );
			} );
		};
	};

	return halonFactory;
} ) );
