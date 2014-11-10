// Setup for running Mocha via Node
var jsdom = require( "jsdom" ).jsdom;
global.document = jsdom( "<html><body></body></html>" );
global.window = document.parentWindow;
