global.halon = require( "../../lib/halon.js" );
global.adapterFactory = require( "../adapterStub.js" );
global.requestFactory = require( "../requestStub.js" );
require( "mocha" );
global.should = require( "should" ); //jshint ignore:line
global.expectedOptionsResponse = require( "../mockResponses/options.json" );
global.expectedBoardResponse = require( "../mockResponses/board101.json" );
global.expectedCardResponse = require( "../mockResponses/board101cards.json" );
global.expectedCardTypeResponse = require( "../mockResponses/board101cardtypes.json" );
global.expectedUserResponse = require( "../mockResponses/user1.json" );
global._ = require( "lodash" );
global.when = require( "when" );
