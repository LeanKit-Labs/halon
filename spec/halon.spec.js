/*global halon, adapterFactory, expectedOptionsResponse, when, _, requestFactory, expectedOptionsResponse, expectedBoardResponse, expectedCardResponse, expectedCardTypeResponse, expectedUserResponse  */
describe( "halon", function() {
	describe( "when initializing a halon client", function() {
		describe( "with no start delay", function() {
			var hc;
			var results = [];
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ]
					},
					adapter: adapterFactory( results ),
					version: 2
				} );
				hc.onReady( function( hc ) {
					done();
				} );
			} );
			it( "should make an OPTIONS request", function() {
				results.length.should.equal( 2 );
				results[ 1 ].should.eql( expectedOptionsResponse );
			} );
			it( "should contain the proper headers", function() {
				results[ 0 ][ 1 ].headers.Accept.should.equal( "application/hal.v2+json" );
			} );
			it( "should create expected options structure on halon client instance", function() {
				hc.should.have.property( "_actions" );
				hc._links.should.eql( expectedOptionsResponse._links );
			} );
		} );
		describe( "with local root", function() {
			var hc;
			var results = [];
			before( function( done ) {
				hc = halon( {
					root: "/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ]
					},
					adapter: adapterFactory( results ),
					version: 2
				} );
				hc.onReady( function( hc ) {
					done();
				} );
			} );
			it( "should make an OPTIONS request", function() {
				results.length.should.equal( 2 );
				results[ 1 ].should.eql( expectedOptionsResponse );
			} );
			it( "should contain the proper headers", function() {
				results[ 0 ][ 1 ].headers.Accept.should.equal( "application/hal.v2+json" );
			} );
			it( "should create expected options structure on halon client instance", function() {
				hc.should.have.property( "_actions" );
				hc._links.should.eql( expectedOptionsResponse._links );
			} );
		} );
		describe( "with a startup delay", function() {
			var hc;
			var results = [];
			var events = [];
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 1,
					doNotStart: true
				} );
				hc.fsm.on( "deferred", function( data ) {
					events.push( data );
				} );
				hc._actions.board.self( { id: 101 } );
				hc._actions.user.self( { id: 1 } );
				hc.start();
				hc.onReady( function( hc ) {
					done();
				} );
			} );
			it( "should allow pre-defined resource methods to fire before options response returns", function() {
				events[ 0 ].queuedArgs.args[ 0 ].should.equal( "invoke.resource" );
				events[ 0 ].queuedArgs.args[ 2 ].should.equal( "board:self" );
				events[ 0 ].queuedArgs.args[ 3 ].should.eql( { id: 101 } );
				events[ 1 ].queuedArgs.args[ 0 ].should.equal( "invoke.resource" );
				events[ 1 ].queuedArgs.args[ 2 ].should.equal( "user:self" );
				events[ 1 ].queuedArgs.args[ 3 ].should.eql( { id: 1 } );
			} );
			it( "should replay queued requests once in ready state", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/board/101",
					method: "GET",
					templated: true
				} );
				results[ 2 ][ 1 ].should.eql( {
					data: { id: 101 },
					headers: { Accept: "application/hal.v1+json" },
					server: "http://localhost:8088"
				} );
				results[ 3 ][ 0 ].should.eql( {
					href: "/analytics/api/user/1",
					method: "GET",
					templated: true
				} );
				results[ 3 ][ 1 ].should.eql( {
					data: { id: 1 },
					headers: { Accept: "application/hal.v1+json" },
					server: "http://localhost:8088"
				} );
			} );
			it( "should create expected options structure on halon client instance", function() {
				hc.should.have.property( "_actions" );
				hc._links.should.eql( expectedOptionsResponse._links );
			} );
			it( "should make an OPTIONS request", function() {
				results[ 0 ][ 0 ].should.eql( { href: "http://localhost:8088/analytics/api",
				method: "OPTIONS" } );
				results[ 0 ][ 1 ].headers.Accept.should.equal( "application/hal.v1+json" );
			} );
		} );
		describe( "when using custom headers", function() {
			describe( "with client-level headers", function() {
				var hc;
				var results = [];
				before( function( done ) {
					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {
							board: [ "self", "users", "cardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1,
						headers: {
							"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
							"If-Match": "8675309"
						}
					} );
					hc.onReady( function( hc ) {
						hc._actions.board.self( { id: 101 } ).then( function() {
							done();
						} );
					} );
				} );
				it( "should send custom headers with OPTIONS request", function() {
					results[ 0 ][ 1 ].headers.should.eql( {
						Accept: "application/hal.v1+json",
						"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
						"If-Match": "8675309"
					} );
				} );
				it( "should send custom headers with resource request", function() {
					results[ 2 ][ 1 ].headers.should.eql( {
						Accept: "application/hal.v1+json",
						"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
						"If-Match": "8675309"
					} );
				} );
			} );
			describe( "with resource-level headers specified", function() {
				var hc;
				var results = [];
				before( function( done ) {
					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {
							board: [ "self", "users", "cardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1
					} );
					hc.onReady( function( hc ) {
						hc._actions.board.self(
							{
								id: 101
							},
							{
								"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
								"If-Match": "8675309"
							}
						).then( function() {
							done();
						} );
					} );
				} );
				it( "should NOT send custom headers with OPTIONS request", function() {
					results[ 0 ][ 1 ].headers.should.eql( { Accept: "application/hal.v1+json" } );
				} );
				it( "should send custom headers with resource request", function() {
					results[ 2 ][ 1 ].headers.should.eql( {
						Accept: "application/hal.v1+json",
						"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
						"If-Match": "8675309"
					} );
				} );
			} );
			describe( "with client-level AND resource-level headers specified", function() {
				var hc;
				var results = [];
				before( function( done ) {
					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {
							board: [ "self", "users", "cardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1,
						headers: {
							"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT"
						}
					} );
					hc.onReady( function( hc ) {
						hc._actions.board.self(
							{
								id: 101
							},
							{
								"If-Match": "8675309"
							}
						).then( function() {
							done();
						} );
					} );
				} );
				it( "should send client-level custom headers with OPTIONS request", function() {
					results[ 0 ][ 1 ].headers.should.eql( {
						Accept: "application/hal.v1+json",
						"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT"
					} );
				} );
				it( "should send client and resource-level headers with resource request", function() {
					results[ 2 ][ 1 ].headers.should.eql( {
						Accept: "application/hal.v1+json",
						"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
						"If-Match": "8675309"
					} );
				} );
			} );
		} );
		describe( "when host is unavailable", function() {
			var hc;
			var actionResult;
			var results = [];
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ]
					},
					adapter: function() {
						return when.reject( new Error( "Server can't talk right now, hazza sad :(" ) );
					},
					version: 2
				} );

				hc.onRejected( function( hc, err, handle ) {
					results.push( err );
					if ( results.length > 4 ) {
						handle.off();
						hc._actions.board.self()
							.then( null, function( err ) {
								actionResult = err;
								done();
							} );
					} else {
						hc.start();
					}
				}, true ).start();
			} );
			it( "should invoke onReject callback with connection error", function() {
				results[ 0 ].toString().should.equal( "Error: Server can't talk right now, hazza sad :(" );
			} );
			it( "should reject API calls", function() {
				actionResult.toString().should.equal( "Error: Server can't talk right now, hazza sad :(" );
			} );
			it( "should attempt connection again if 'start' is called", function() {
				results.length.should.equal( 5 );
			} );
		} );
	} );

	describe( "when using a halon instance", function() {
		describe( "when invoking a root 'options' resource link", function() {
			var hc;
			var results = [];
			var board;
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.board.self( { id: 101 } ).then( function( bd ) {
						board = bd;
						done();
					} );
				} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/board/101",
					method: "GET",
					templated: true
				} );
				results[ 2 ][ 1 ].should.eql( {
					data: { id: 101 },
					headers: { Accept: "application/hal.v3+json" },
					server: "http://localhost:8088"
				} );
			} );
			it( "should create _actions on returned resource", function() {
				( typeof board._actions.self ).should.equal( "function" );
				( typeof board._actions.minimal ).should.equal( "function" );
				( typeof board._actions.users ).should.equal( "function" );
				( typeof board._actions.cards ).should.equal( "function" );
				( typeof board._actions.cardTypes ).should.equal( "function" );
				( typeof board._actions.classesOfService ).should.equal( "function" );
				( typeof board._actions.lanes ).should.equal( "function" );
			} );
			it( "should return expected resource data", function() {
				var propsToCheck = [ "_links", "id", "title", "description", "classOfServiceEnabled", "organizationId", "laneTypes", "laneClassTypes", "tags", "priorities" ];
				_.each( expectedBoardResponse, function( val, key ) {
					if ( propsToCheck.indexOf( key ) !== -1 ) {
						val.should.eql( board[ key ] );
					}
				} );
				_.each( expectedBoardResponse.embedded, function( val, key ) {
					board[ key ].should.eql( val );
				} );
			} );
		} );
		describe( "when following a rel link on a returned resource", function() {
			var hc;
			var results = [];
			var board;
			var lanes;
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "users", "cardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.board.self( { id: 101 } ).then( function( bd ) {
						board = bd;
						board._actions.lanes().then( function( l ) {
							lanes = l;
							done();
						} );
					} );
				} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 4 ][ 0 ].should.eql( {
					href: "/analytics/api/board/101/lane",
					method: "GET"
				} );
				results[ 4 ][ 1 ].should.eql( { data: {}, headers: { Accept: "application/hal.v3+json" }, server: "http://localhost:8088" } );
			} );
			it( "should create _actions on returned resource", function() {
				( typeof lanes._actions.self ).should.equal( "function" );
				( typeof lanes._actions.minimal ).should.equal( "function" );
				( typeof lanes._actions.users ).should.equal( "function" );
				( typeof lanes._actions.cardTypes ).should.equal( "function" );
				( typeof lanes._actions.classesOfService ).should.equal( "function" );
				( typeof lanes._actions.lanes ).should.equal( "function" );
			} );
			it( "should return expected resource data", function() {
				var propsToCheck = [ "_links", "id" ];
				_.each( expectedBoardResponse, function( val, key ) {
					if ( propsToCheck.indexOf( key ) !== -1 ) {
						val.should.eql( board[ key ] );
					}
				} );
				_.each( expectedBoardResponse.embedded, function( val, key ) {
					board[ key ].should.eql( val );
				} );
			} );
		} );

		describe( "when using verbs that can have a request body", function() {
			describe( "when using PUT", function() {
				var hc;
				var results = [];
				var lane = {
					"id": "307",
					"name": "Lane 3",
					"description": "Lane 3 Description",
					"laneClassTypeId": 0,
					"laneTypeId": 3,
					"active": true,
					"cardLimit": [
						5,
						5
					],
					"creationDate": "2009-08-19T01:37:16.000Z",
					"index": 2,
					"boardId": "101",
					"taksBoardId": null,
					"parentLaneId": null,
					"activityId": "2"
				};
				before( function( done ) {
					hc = halon( {
						root: "http://localhost:8088/analytics/altapi",
						adapter: adapterFactory( results ),
						version: 3
					} );
					hc.onReady( function( hc ) {
						hc._actions.board.addLane( lane ).then( function() {
							done();
						} );
					} );
				} );
				it( "should pass expected arguments to the adapter", function() {
					results[ 2 ][ 0 ].should.eql( {
						href: "/analytics/api/board/101/lane/307",
						method: "PUT",
						templated: true
					} );
					results[ 2 ][ 1 ].should.eql( { data: lane, headers: { Accept: "application/hal.v3+json" }, server: "http://localhost:8088" } );
				} );
			} );
		} );

		describe( "when using the client instance as a function", function() {
			var hc;
			var results = [];
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					adapter: adapterFactory( results )
				} );
			} );
			it( "should allow for parallel resource link invocations", function( done ) {
				hc.onReady( function( hc ) {
					hc(
						hc._actions.user.self( { id: 1 } ),
						hc._actions.board.self( { id: 101 } ),
						hc._actions.board.cardTypes( { id: 101 } )
					).then( function( responses ) {
						var userReponse = responses[ 0 ];
						var boardResponse = responses[ 1 ];
						var cardTypesReponse = responses[ 2 ];
						// remove the _actions prop so we can do an `eql` comparison
						delete userReponse._actions;
						delete boardResponse._actions;
						delete cardTypesReponse._actions;
						userReponse.should.eql( expectedUserResponse );
						boardResponse.should.eql( expectedBoardResponse );
						cardTypesReponse.should.eql( expectedCardTypeResponse );
						done();
					} );
				} );
			} );
		} );

		describe( "when following an action that returns a collection", function() {
			var hc;
			var results = [];
			var collection;
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "cards" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.board.cards( { id: 101 } ).then( function( result ) {
						collection = result;
						done();
					} );
				} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/board/101/card",
					method: "GET",
					templated: true
				} );
				results[ 2 ][ 1 ].should.eql( { data: { id: 101 }, headers: { Accept: "application/hal.v3+json" }, server: "http://localhost:8088" } );
			} );
			it( "should create _actions on returned resources", function() {
				_.each( collection.cards, function( card ) {
					( typeof card._actions.self ).should.equal( "function" );
					( typeof card._actions.block ).should.equal( "function" );
					( typeof card._actions.move ).should.equal( "function" );
				} );
			} );
			it( "should return expected number of resources", function() {
				collection.cards.length.should.equal( 3 );
			} );
			it( "should preserve _origin", function() {
				collection._origin.should.eql( { href: "/analytics/api/board/101/card", method: "GET" } );
			} );
			it( "should keep resource data in-tact", function() {
				var propsToCheck = [ "_links", "id", "title", "description", "_origin" ];
				_.each( collection.cards, function( card ) {
					var expectedCard = _.where( expectedCardResponse.cards, { id: card.id } );
					_.each( expectedCard, function( val, key ) {
						if ( propsToCheck.indexOf( key ) !== -1 ) {
							val.should.eql( card[ key ] );
						}
					} );
				} );
			} );
		} );

		describe( "when calling an action that provides parameter definitions", function() {
			var hc;
			var results = [];
			var list;
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.package.list( {
						project: "one",
						build: 1,
						version: "0.1.0"
					} ).then( function( result ) {
						list = result;
						done();
					} );
				} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/nonstop/package?project=one&build=1&version=0.1.0",
					method: "GET",
					parameters: {
						project: { choice: [ "one", "two" ] },
						build: { choice: [ 1, 2, 3, 4, 5 ] },
						version: { choice: [ "0.1.0", "0.1.2", "0.1.4" ] }
					}
				} );
				results[ 2 ][ 1 ].should.eql( { data: { project: "one", build: 1, version: "0.1.0" }, headers: { Accept: "application/hal.v3+json" }, server: "http://localhost:8088" } );
			} );
			it( "should return list of packages", function() {
				list.packages.length.should.equal( 0 );
			} );
		} );

		describe( "when calling an action with user supplied parameters", function() {
			var hc;
			var results = [];
			var list;
			before( function( done ) {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.package.project( {
						"?": {
							owner: "me",
							build: 1,
							version: "0.1.0"
						}
					} ).then( function( result ) {
						list = result;
						done();
					} );
				} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/nonstop/project?owner=me&build=1&version=0.1.0",
					method: "GET"
				} );
				results[ 2 ][ 1 ].should.eql( { data: {}, headers: { Accept: "application/hal.v3+json" }, server: "http://localhost:8088" } );
			} );
			it( "should return list of packages", function() {
				list.projects.length.should.equal( 0 );
			} );
		} );

		describe( "when sending formData (request adapter only)", function() {
			var results = [];
			var resp;
			var fauxRequest = requestFactory( adapterFactory( results ) );
			before( function( done ) {
				var hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: halon.requestAdapter( fauxRequest ),
					version: 3
				} );
				hc.onReady( function( hc ) {
					hc._actions.package.upload( {
						formData: {
							"myFile.txt": { pretendFileStream: true }
						}
					} ).then( function( result ) {
						resp = result;
						done();
					} );
				} );
			} );
			it( "should return an empty response", function() {
				resp.should.eql( {} );
			} );

			it( "should create options with formData property", function() {
				results[ 2 ][ 1 ].should.eql( {
					method: "POST",
					url: "http://localhost:8088/analytics/api/nonstop/upload",
					headers: { Accept: "application/hal.v3+json" },
					formData: { "myFile.txt": { pretendFileStream: true } }
				} );
			} );
		} );
	} );
} );
