var gulp = require( "gulp" );
var gutil = require( "gulp-util" );
var sourcemaps = require( "gulp-sourcemaps" );
var rename = require( "gulp-rename" );
var header = require( "gulp-header" );
var pkg = require( "./package.json" );
var hintNot = require( "gulp-hint-not" );
var uglify = require( "gulp-uglify" );
var jshint = require( "gulp-jshint" );
var jscs = require( "gulp-jscs" );
var gulpChanged = require( "gulp-changed" );

var banner = [ "/**",
	" * <%= pkg.name %> - <%= pkg.description %>",
	" * Author: <%= pkg.author %>",
	" * Version: v<%= pkg.version %>",
	" * Url: <%= pkg.homepage %>",
	" * License(s): <% pkg.licenses.forEach(function( license, idx ){ %><%= license.type %> Copyright (c) <%= ( new Date() ).getFullYear() %> LeanKit<% if(idx !== pkg.licenses.length-1) { %>, <% } %><% }); %>",
	" */",
"" ].join( "\n" );

function buildLib() {
	return gulp.src( "src/halon.js" )
		.pipe( hintNot() )
		.pipe( sourcemaps.init() )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( gulp.dest( "lib/" ) );
}

gulp.task( "build:quick", function() {
	return buildLib();
} );

gulp.task( "build:minified", [ "format" ], function() {
	return buildLib()
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

gulp.task( "default", [ "build:minified" ] );

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

gulp.task( "jshint", function() {
	return gulp.src( [ "src/**/*.js", "spec/**/*.spec.js" ] )
		.pipe( jshint() )
		.pipe( jshint.reporter( "jshint-stylish" ) )
		.pipe( jshint.reporter( "fail" ) );
} );

gulp.task( "format", [ "jshint" ], function() {
	return gulp.src( [ "**/*.js", "!node_modules/**" ] )
		.pipe( jscs( {
			configPath: ".jscsrc",
			fix: true
		} ) )
		.on( "error", function( error ) {
			gutil.log( gutil.colors.red( error.message ) );
			this.end();
		} )
		.pipe( gulpChanged( ".", { hasChanged: gulpChanged.compareSha1Digest } ) )
		.pipe( gulp.dest( "." ) );
} );

gulp.task( "watch", function() {
	gulp.watch( "src/**/*", [ "default" ] );
	gulp.watch( "{lib,spec}/**/*", [ "mocha" ] );
} );

gulp.task( "continuous", [ "mocha", "watch" ] );
