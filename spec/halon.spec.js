describe( "halon", function() {
	describe( "when initializing a halon client", function() {
		describe( "with no start delay", function() {
			var hc;
			var results = [];
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ]
					},
					adapter: adapterFactory( results ),
					version: 2,
					start: true
				} );
				return hc.connect();
			} );
			it( "should make an OPTIONS request", function() {
				results.length.should.equal( 2 );
				results[ 1 ].should.eql( expectedOptionsResponse );
			} );
			it( "should contain the proper headers", function() {
				results[ 0 ][ 1 ].headers.Accept.should.equal( "application/hal.v2+json" );
			} );
			it( "should create expected options structure on halon client instance", function() {
				hc._links.should.eql( expectedOptionsResponse._links );
			} );
			it( "should immediately invoke onReady if already in a ready state", function() {
				var callback = sinon.stub();
				hc.on( "ready", callback );
				callback.should.be.calledOnce;
			} );
		} );
		describe( "with local root", function() {
			var hc;
			var results = [];
			before( function() {
				hc = halon( {
					root: "/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ]
					},
					adapter: adapterFactory( results ),
					version: 2
				} );
				return hc.connect();
			} );
			it( "should make an OPTIONS request", function() {
				results.length.should.equal( 2 );
				results[ 1 ].should.eql( expectedOptionsResponse );
			} );
			it( "should contain the proper headers", function() {
				results[ 0 ][ 1 ].headers.Accept.should.equal( "application/hal.v2+json" );
			} );
			it( "should create expected options structure on halon client instance", function() {
				hc._links.should.eql( expectedOptionsResponse._links );
			} );
		} );
		describe( "with a startup delay", function() {
			var hc;
			var results = [];
			var events = [];
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 1
				} );
				hc.fsm.on( "deferred", function( data ) {
					events.push( data );
				} );
				hc.board.self( { id: 101 } );
				hc.user.self( { id: 1 } );
				return hc.connect();
			} );
			it( "should allow pre-defined resource methods to fire before options response returns", function() {
				events[ 0 ].queuedArgs.args[ 0 ].should.eql( {
					delegated: false,
					inputType: "invoke.resource",
					ticket: undefined
				} );
				events[ 0 ].queuedArgs.args[ 2 ].should.equal( "board:self" );
				events[ 0 ].queuedArgs.args[ 3 ].should.eql( { id: 101 } );
				events[ 1 ].queuedArgs.args[ 0 ].should.eql( {
					delegated: false,
					inputType: "invoke.resource",
					ticket: undefined
				} );
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
							board: [ "self", "getUsers", "getCardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1,
						headers: {
							"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
							"If-Match": "8675309"
						}
					} );
					hc.on( "ready", function( hc ) {
						hc.board.self( { id: 101 } ).then( function() {
							done();
						} );
					} ).connect();
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
				before( function() {
					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {
							board: [ "self", "getUsers", "getCardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1,
						start: true
					} );
					return hc.connect()
						.then( function( hc ) {
							return hc.board.self(
								{
									id: 101
								},
								{
									"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT",
									"If-Match": "8675309"
								}
							);
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
				before( function() {
					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {
							board: [ "self", "getUsers", "getCardTypes" ],
							user: [ "self" ]
						},
						adapter: adapterFactory( results ),
						version: 1,
						headers: {
							"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT"
						}
					} );
					return hc.connect()
						.then( function( hc ) {
							return hc.board.self(
								{
									id: 101
								},
								{
									"If-Match": "8675309"
								}
							);
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
			var consoleStub;
			before( function( done ) {
				consoleStub = sinon.stub( console, "warn" ); // Silence console output
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ]
					},
					adapter: function() {
						return when.reject( new Error( "Server can't talk right now, hazza sad :(" ) );
					},
					version: 2
				} );

				hc.on( "rejected", function( hc, err, handle ) {
					results.push( err );
					if ( results.length > 4 ) {
						handle.off();
						hc.board.self()
							.then( null, function( err ) {
								actionResult = err;
								done();
							} );
					} else {
						hc.connect().catch( function() {} );
					}
				}, true ).connect().catch( function() {} );
			} );
			it( "should invoke onReject callback with connection error", function() {
				results[ 0 ].toString().should.equal( "Error: Server can't talk right now, hazza sad :(" );
			} );
			it( "should warn of the connection error", function() {
				consoleStub.should.have.callCount( 5 );
			} );
			it( "should reject API calls", function() {
				actionResult.toString().should.equal( "Error: Server can't talk right now, hazza sad :(" );
			} );
			it( "should attempt connection again if 'start' is called", function() {
				results.length.should.equal( 5 );
			} );
			after( function() {
				consoleStub.restore();
			} );
		} );
	} );

	describe( "when using a halon instance", function() {
		describe( "when invoking a root 'options' resource link", function() {
			var hc;
			var results = [];
			var board;
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						return hc.board.self( { id: 101 } )
							.then( function( bd ) {
								board = bd;
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
			it( "should create actions on returned resource", function() {
				board.self.should.be.a( "function" );
				board.minimal.should.be.a( "function" );
				board.getUsers.should.be.a( "function" );
				board.getCards.should.be.a( "function" );
				board.getCardTypes.should.be.a( "function" );
				board.getClassesOfService.should.be.a( "function" );
				board.getLanes.should.be.a( "function" );
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
		describe( "when invoking a root 'options' resource link that wasn't returned on the OPTIONS call", function() {
			var hc;
			var results = [];
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "shouldFail" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				return hc.connect();
			} );

			it( "should throw an error", function() {
				return hc.board.shouldFail().should.be.rejectedWith( /No link definition/ );
			} );
		} );
		describe( "when following a rel link on a returned resource", function() {
			var hc;
			var results = [];
			var board;
			var lanes;
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "self", "getUsers", "getCardTypes" ],
						user: [ "self" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						return hc.board.self( { id: 101 } ).then( function( bd ) {
							board = bd;
							board.getLanes().then( function( l ) {
								lanes = l;
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
			it( "should create actions on returned resource", function() {
				lanes.self.should.be.a( "function" );
				lanes.minimal.should.be.a( "function" );
				lanes.getUsers.should.be.a( "function" );
				lanes.getCardTypes.should.be.a( "function" );
				lanes.getClassesOfService.should.be.a( "function" );
				lanes.getLanes.should.be.a( "function" );
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
				before( function() {
					hc = halon( {
						root: "http://localhost:8088/analytics/altapi",
						adapter: adapterFactory( results ),
						version: 3
					} );
					return hc.connect()
						.then( function( hc ) {
							return hc.board.addLane( lane );
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

			it( "should allow for parallel resource link invocations", function() {
				return hc.connect()
					.then( function( hc ) {
						hc(
							hc.user.self( { id: 1 } ),
							hc.board.self( { id: 101 } ),
							hc.board.getCardTypes( { id: 101 } )
						).then( function( responses ) {
							var userReponse = responses[ 0 ];
							var boardResponse = responses[ 1 ];
							var cardTypesReponse = responses[ 2 ];
							userReponse.should.eql( expectedUserResponse );
							boardResponse.should.eql( expectedBoardResponse );
							cardTypesReponse.should.eql( expectedCardTypeResponse );
						} );
					} );
			} );
		} );

		describe( "when following an action that returns a collection", function() {
			var hc;
			var results = [];
			var collection;
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {
						board: [ "getCards" ]
					},
					adapter: adapterFactory( results ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						hc.board.getCards( { id: 101 } ).then( function( result ) {
							collection = result;
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
			it( "should create actions on returned resources", function() {
				_.each( collection.cards, function( card ) {
					card.self.should.be.a( "function" );
					card.block.should.be.a( "function" );
					card.move.should.be.a( "function" );
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
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.connect()
					.then( function( hc ) {
						hc.package.list( {
							project: "one",
							build: 1,
							version: "0.1.0"
						} ).then( function( result ) {
							list = result;
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
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: adapterFactory( results ),
					version: 3
				} );
				hc.connect()
					.then( function( hc ) {
						hc.package.getProject( {
							"?": {
								owner: "me",
								build: 1,
								version: "0.1.0"
							}
						} ).then( function( result ) {
							list = result;
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

		describe( "when calling an action with user supplied parameters and array body", function() {
			var hc;
			var results = [];
			var list;
			before( function() {
				hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: adapterFactory( results ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						hc.board.edit( {
							id: 101,
							body: [
								{ op: "change", path: "title", value: "New Board Title" },
								{ op: "change", path: "description", value: "This is a new description for the board" }
							]
						} ).then( function( result ) {
							list = result;
						} );
					} );
			} );
			it( "should pass expected arguments to the adapter", function() {
				results[ 2 ][ 0 ].should.eql( {
					href: "/analytics/api/board/101",
					method: "PATCH",
					templated: true
				} );
				results[ 2 ][ 1 ].should.eql(
					{
						data: [
							{ op: "change", path: "title", value: "New Board Title" },
							{ op: "change", path: "description", value: "This is a new description for the board" }
						],
						headers: { Accept: "application/hal.v3+json" },
						server: "http://localhost:8088"
					}
				);
			} );
		} );

		describe( "when sending formData (request adapter only)", function() {
			var results = [];
			var resp;
			var fauxRequest = requestFactory( adapterFactory( results ) );
			before( function() {
				var hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: halon.requestAdapter( fauxRequest ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						hc.package.upload( {
							formData: {
								"myFile.txt": { pretendFileStream: true }
							}
						} ).then( function( result ) {
							resp = result;
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

		describe( "when processing non-JSON response (error messages)", function() {
			var results = [];
			var resp;
			var fauxRequest = requestFactory( adapterFactory( results ) );
			before( function() {
				var hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: halon.requestAdapter( fauxRequest ),
					version: 3
				} );
				hc.connect()
					.then( function( hc ) {
						hc.elevated.gimme( {
							this: "is a test",
							for: "a json body"
						} ).then( function( result ) {
							resp = result;
						} );
					} );
			} );

			it( "should return plain error message", function() {
				resp.should.eql( "User lacks sufficient permissions" );
			} );

			it( "should create options with json content type", function() {
				results[ 2 ][ 1 ].should.eql( {
					method: "POST",
					url: "http://localhost:8088/analytics/api/elevated/gimme",
					headers: {
						Accept: "application/hal.v3+json",
						"Content-Type": "application/json"
					},
					json: {
						this: "is a test",
						for: "a json body"
					}
				} );
			} );
		} );
		describe( "when processing empty responses (204)", function() {
			var results = [];
			var resp;
			var fauxRequest = requestFactory( adapterFactory( results ) );
			before( function() {
				var hc = halon( {
					root: "http://localhost:8088/analytics/api",
					knownOptions: {},
					adapter: halon.requestAdapter( fauxRequest ),
					version: 3
				} );
				return hc.connect()
					.then( function( hc ) {
						hc.this.delete()
							.then( function( result ) {
								resp = result;
							} );
					} );
			} );

			it( "should return an empty response", function() {
				resp.should.eql( "" );
			} );

			it( "should create options with json content type", function() {
				results[ 2 ][ 1 ].should.eql( {
					method: "DELETE",
					url: "http://localhost:8088/analytics/api/this/204",
					headers: {
						Accept: "application/hal.v3+json"
					}
				} );
			} );
		} );
		describe( "when processing failed responses (404)", function() {
			var results = [];
			var resp;
			var fauxRequest = requestFactory( adapterFactory( results ) );
			var consoleStub;
			var hc;
			before( function() {
				consoleStub = sinon.stub( console, "warn" ); // Silence console output
				hc = halon( {
					root: "http://localhost:8088/analytics/not_exist",
					knownOptions: {},
					adapter: halon.requestAdapter( fauxRequest ),
					version: 3,
					start: true
				} );
			} );

			it( "should return an empty response", function( done ) {
				hc.on( "rejected", function( client, err, listener ) {
					err.should.match( /Not found/ );
					listener.off();
					done();
				} );
			} );
			after( function() {
				consoleStub.restore();
			} );
		} );
	} );
	describe( "when using adapters", function() {
		describe( "when setting a default adapter", function() {
			describe( "with no adapter passed into the factory", function() {
				var fauxAdapter;
				before( function() {
					fauxAdapter = sinon.stub().resolves( {} );
					halon.defaultAdapter( fauxAdapter );

					var hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {},
						version: 3
					} );

					return hc.connect();
				} );

				it( "should use the default adapter", function() {
					fauxAdapter.should.be.calledOnce;
				} );
			} );
			describe( "with an adapter passed into the factory", function() {
				var fauxAdapter, overrideAdapter;
				before( function() {
					fauxAdapter = sinon.stub().resolves( {} );
					overrideAdapter = sinon.stub().resolves( {} );

					halon.defaultAdapter( fauxAdapter );

					var hc = halon( {
						root: "http://localhost:8088/analytics/api",
						knownOptions: {},
						adapter: overrideAdapter,
						version: 3
					} );

					return hc.connect();
				} );

				it( "should use the adapter passed into options", function() {
					overrideAdapter.should.be.calledOnce;
					fauxAdapter.should.not.be.called;
				} );
			} );
		} );
		describe( "when using the jQuery adapter", function() {
			var faux$;
			describe( "with an OPTIONS request", function() {
				before( function() {
					var ajaxStub = sinon.stub();
					ajaxStub.onFirstCall().resolves( require( "./mockResponses/options.json" ) );
					ajaxStub.resolves( {} );

					faux$ = {
						ajax: ajaxStub
					};

					var hc = halon( {
						root: "http://localhost:8088/analytics/api",
						version: 3,
						adapter: halon.jQueryAdapter( faux$ )
					} );

					return hc.connect();
				} );

				it( "should prepare the options for $.ajax", function() {
					faux$.ajax.should.be.calledOnce.and.calledWith( {
						url: "http://localhost:8088/analytics/api",
						type: "OPTIONS",
						headers: { Accept: "application/hal.v3+json" },
						dataType: "json",
						data: undefined
					} );
				} );
			} );

			describe( "with failure", function() {
				var hc;
				before( function() {
					sinon.stub( console, "warn" );

					var ajaxStub = sinon.stub().returns( {
						then: function( res, rej ) {
							rej( "one", "two", "three" );
						}
					} );

					faux$ = {
						ajax: ajaxStub
					};

					hc = halon( {
						root: "http://localhost:8088/analytics/api",
						version: 3,
						adapter: halon.jQueryAdapter( faux$ )
					} );
				} );
				after( function() {
					console.warn.restore();
				} );
				it( "should pass jQuery err argument to reject handler", function() {
					return hc.connect().should.eventually.be.rejectedWith( "three" );
				} );
			} );

			describe( "when making a POST request", function() {
				before( function() {
					var ajaxStub = sinon.stub();
					ajaxStub.onFirstCall().resolves( require( "./mockResponses/options.json" ) );
					ajaxStub.resolves( {} );

					faux$ = {
						ajax: ajaxStub
					};

					var hc = halon( {
						root: "http://localhost:8088/analytics/api",
						version: 3,
						adapter: halon.jQueryAdapter( faux$ )
					} );

					return hc.connect().then( function( hc ) {
						return hc.elevated.gimme( {
							this: "is a test",
							for: "a json body"
						} ).then( function() {
							return hc.elevated.gimme( "string" );
						} );
					} );
				} );

				it( "should prepare JSON data when included", function() {
					faux$.ajax.secondCall.should.be.calledWith( {
						type: "POST",
						url: "/analytics/api/elevated/gimme",
						headers: {
							Accept: "application/hal.v3+json"
						},
						contentType: "application/json",
						dataType: "json",
						data: JSON.stringify( {
							this: "is a test",
							for: "a json body"
						} )
					} );
				} );

				it( "should not attempt to JSON encode a string", function() {
					faux$.ajax.thirdCall.should.be.calledWith( {
						type: "POST",
						url: "/analytics/api/elevated/gimme",
						headers: {
							Accept: "application/hal.v3+json"
						},
						contentType: "application/json",
						dataType: "json",
						data: "string"
					} );
				} );

			} );

			describe( "when making a non POST, PUT or PATCH request", function() {
				before( function() {
					var ajaxStub = sinon.stub();
					ajaxStub.onFirstCall().resolves( require( "./mockResponses/options.json" ) );
					ajaxStub.resolves( {} );

					faux$ = {
						ajax: ajaxStub
					};

					var hc = halon( {
						root: "http://localhost:8088/analytics/api",
						version: 3,
						adapter: halon.jQueryAdapter( faux$ )
					} );

					return hc.connect().then( function( hc ) {
						return hc.board.self( { id: 101 } );
					} );
				} );

				it( "should not attempt to JSON encode data", function() {
					faux$.ajax.secondCall.should.be.calledWith( {
						type: "GET",
						url: "/analytics/api/board/101",
						headers: {
							Accept: "application/hal.v3+json"
						},
						dataType: "json",
						data: { id: 101 }
					} );
				} );
			} );
		} );
	} );
} );
