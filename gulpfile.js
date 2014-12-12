var gulp = require( "gulp" );
var sourcemaps = require( "gulp-sourcemaps" );
var rename = require( "gulp-rename" );
var header = require( "gulp-header" );
var pkg = require( "./package.json" );
var hintNot = require( "gulp-hint-not" );
var uglify = require( "gulp-uglify" );

var banner = [ "/**",
	" * <%= pkg.name %> - <%= pkg.description %>",
	" * Author: <%= pkg.author %>",
	" * Version: v<%= pkg.version %>",
	" * Url: <%= pkg.homepage %>",
	" * License(s): <% pkg.licenses.forEach(function( license, idx ){ %><%= license.type %> Copyright (c) 2014 LeanKit<% if(idx !== pkg.licenses.length-1) { %>, <% } %><% }); %>",
	" */",
"" ].join( "\n" );

gulp.task( "default", function() {
	return gulp.src( "src/halon.js" )
		.pipe( hintNot() )
		.pipe( sourcemaps.init() )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( gulp.dest( "lib/" ) )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( sourcemaps.write() )
		.pipe( uglify( {
			compress: {
				negate_iife: false // jshint ignore:line
			}
		} ) )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( rename( "halon.min.js" ) )
		.pipe( gulp.dest( "lib/" ) );
} );

var mocha = require( "gulp-spawn-mocha" );
gulp.task( "mocha", function() {
	return gulp.src( [ "spec/**/*.spec.js" ], { read: false } )
		.pipe( mocha( {
			require: [ "spec/helpers/node-setup.js" ],
			reporter: "spec",
			colors: true,
			inlineDiffs: true,
			debug: false
		} ) )
		.on( "error", console.warn.bind( console ) );
} );

gulp.task( "watch", function() {
	gulp.watch( "src/**/*", [ "default" ] );
	gulp.watch( "{lib,spec}/**/*", [ "mocha" ] );
} );

gulp.task( "continuous", [ "mocha", "watch" ] );
