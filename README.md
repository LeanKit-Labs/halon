# halon v0.1.0

## Obligatory Disclaimer
This project is not stable yet - expect *lots* of change. Don't say we didn't warn you. :-)

## What Is It?
Halon is a hypermedia client library for both browser and node.js usage. It attempts to follow the [JSON Hypertext Application Language (HAL)](https://tools.ietf.org/html/draft-kelly-json-hal-06) draft spec, and includes some additional data we feel is important. At LeanKit, we're using it in tandem with [autohost](https://github.com/LeanKit-Labs/autohost/) and [hyped](https://github.com/LeanKit-Labs/hyped/).

## Initializing a Client

```javascript
var client = halon({
	root: "http://yourserver/api",
	knownOptions: {
		someResource: [ "self", "getChildren", "summary" ]
	},
	adapter: halon.jQueryAdapter($),
	version: 2
});
```

The `options` arg that's passed to halon can contain the following:

* `root` (required) - string url to your root api
* `knownOptions` (optional) - an object containing resources (keys) and their rels that you know about ahead of time. This enables you to begin making requests before the `OPTIONS` reponse has technically returned, though halon will simply queue the requests underneath the hood, and release them once the `OPTIONS` response has been processed.
* `adapter` - a function with the signature of `(link, options)` that handles translating halon's meta data to the HTTP transport of your choice. a jQuery adapter is included in halon and can be accessed by call `halon.jQueryAdapter($)` (note that you need to pass jQuery to the method call).
* `version` - defaults to "1". Allows you to set the api version. Halon will then change the `Accept` header value appropriately (e.g. - version 2 would get you `application/hal.v2+json`).
* `start` - try to establish a connection immediately; do not wait for the `connect` call.

## Root API
Halon only needs your root API. As it initializes, it will make an `OPTIONS` request against this url, and the options returned from the server will be processed, creating resource methods you can invoke on your client instance. Any resources (and their related "rels") will be available al properties of the client instance. For example, if your server returns an options response like this, the methods `client.user.self` and `client.user.getAddresses` would be available:

> Note: in order to prevent naming collisions - action names should denote an action and not overlap with property names.

```javascript
{
	"_links": {
        "user:self": {
            "href": "/api/user/{id}",
            "method": "GET",
            "templated": true
        },
        "user:getAddresses": {
            "href": "/api/user/{id}/address",
            "method": "GET",
            "templated": true
        }
    }
}
```

If you already know ahead of time about any resources that the root `OPTIONS` response will include, you can provide them via the `knownOptions` property on the options passed to halon. This sets up the methods ahead of time, and invoking them results in a request being queued. Once the `OPTIONS` response has been processed, halon internally moves into a `ready` state, and any queued requests will be sent to the server in the order they were queued. This behavior can be helpful in avoiding often-unwieldy "temporal dependency" code, where calls against halon's API would have to be done after resolving the `connect` promise or after handling the `ready` event.

### Connectivity
Halon provides a connect call to initiate the connection and two events that signal the status of the underlying adapter.

#### connect()
The connect call returns a promise that will either resolve to the client instance or reject with a connection error after the `OPTIONS` call is made.

> Multiple calls to connect before the connection is established or rejected will result in the same promise.

```javascript
var client = halon( {
	root: "http://server/api",
	adapter: halon.jQueryAdapter($)
} );
client.connect()
	.then( onSuccess, onFailure );
```

#### on( event, callback, [persistent] )
Attach a callback to one of two events:
 * `ready` - fires when the `OPTIONS` call succeeds
 * `rejected` - fires when the `OPTIONS` call fails

Pass true to the `persistent` argument if you'd like your callback to be invoked _every_ time the event fires.

> Recommendation - Use the event handlers to plug in a connection management strategy.

```javascript
var client = halon( {
	root: "http://server/api",
	adapter: halon.jQueryAdapter($)
} );
client
	.on( "ready", function( client ) {
		// Any resources/rels returned as part of the options
		// are now available to invoke.
		// The halon client instance is passed as an argument
		// to this callback for convenience.
	} )
	.on( "rejected", function( client, err, listener ) {
		// call client.connect() to attempt the connection again
		// call listener.off() when you no longer wish to receive callbacks
	} )
	.connect();
```

## Getting Resources

Let's say the first thing you want to do, after we've processed our options response, is fetch a user resource, using the "self" rel:

```javascript
// the id here needs to match the templated url id exactly
// (e.g. - /api/user/{id})
client.user.self({ id: 12 }).then(user) {
	// user resource - will contain actions for all rels included.
	// halon takes embedded resources and places them on
	// the parent resource's state, using the embedded key
	// name as the property name. For example, if user
	// addresses were embedded with the user, under the
	// "addresses" key, we could do something like this:
	var toRemove = user.addresses.filter(function(address) {
		return address.city === "Nashville";
	})[0];
	user.deleteAddress({ id: toRemove.id }).then(function(){
		console.log("Buh bye Nashville....");
	});
});
```

You can see from the above example that we can "follow links" that are returned with the root `OPTIONS` response, as well as links included with a returned resource.

## Adapters
Halon uses an adapter approach to handling the actual transport concern. An adapter is simply a function that takes `link` and `options` arguments and returns a promise. The promise is expected to resolve to an object (vs. a string or stream of the response body).

#### link

The `link` argument will always specify the relative url and method.
```javascript
// a templated example - this means `id` needs to be included
// on the options.data member passed as the second arg to the adapter
{
	href: "/api/user/{id}",
	method: "GET",
	templated: true
}
```

#### options

The `options` argument can currently contain `data`, `headers` and `server` properties. If we're requesting user ID 34, for example, the `options` argument might look like this (note that halon includes the `Accept` value under `headers` for you by default:

```javascript
{
	data: { id: 34 },
	headers: {
		Accept: "application/hal+json"
	}
}
```

#### parameters

There are two ways to pass parameters to a URL. The preferred way is to include parameter arguments directly. This will introduce the least amount of coupling to how a particular action is implemented (path variables vs. query parameters vs. request body).

You can also supply a `?` property to the `options` argument to define parameters as well.

```javascript
// trust that the URL defines these variables either by path or query parameters
client.board.getList( { page: 1, limit: 10 } );

// pass parameters explicitly - could lead to your call failing later if the route changes
client.board.getList( { "?": { page: 1, limit: 10 } } )
```

#### arrays

There are times when the body you need to submit to an action will be an array (e.g. a list of ops for a PATCH). To submit an array and still provide values to any path arguments or query parameters that may exist on the call, simply include the array in a `body` property:

```javascript
client.board.edit( {
	id: 100100,
	body: [
		{ op: "change", path: "title", value: "New Board Title" },
		{ op: "change", path: "description", value: "This is a new description for the board" }
	]
} )
```

This will use the id property to fill any query parameter or path variables and only submit the array under body to the PATCH action.

> This feature should _only_ be used when the body is an array. Avoid over-specification for other use cases.

### defaults

If you are planning to new up several halon client instances, you can specify a default adapter by calling `halon.defaultAdapter()` and passing the default adapter function. After doing this, you won't have to specify an `adapter` property on your options argument unless you're overriding the default you specified.

### Included Adapters
Halon comes with two built-in adapters: one for the browser, and one for Node.js.
#### jQuery
Halon does not have an opinion about which XHR abstraction you use. Due to the popularity of jQuery, we include one for `$.ajax`.

__implementation__
```javascript
var jQueryAdapter = function( $ ) {
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
```

#### request
Halon provides an adapter that takes an existing [`request`](https://github.com/request/) instance.

```javascript
var halon = require( "halon" );
var request = require( "request" );
var client = halon( { root: "http://yourserver/api", adapter: halon.requestAdapter( request ) } );
```

__Form submission & Uploads__
`request` supports uploads and multipart form submission via the formData hash that request understands. (See [request](https://github.com/request/request#multipartform-data-multipart-form-uploads) for more details).

// assuming you have a resource named "file" and a POST action "upload"
var form = {};
form[ "myFile.txt" ] = fs.createReadStream( "/path/to/myFile.txt" );
client.file.upload( { formData: form } );
```

## Specifying Custom Headers

Halon will always provide an `Accept` header value for you, but you can provide your own headers to be sent along with every request (at the client level) and/or at the resource level:

```javascript
// To provide client-level headers, provide a `headers`
// property on your halon options object:
var hc = halon( {
	root: "http://your.server.com/api",
	adapter: halon.jQueryAdapter( $ ),
	headers: {
		"If-Modified-Since": "Sat, 29 Nov 2014 19:35:20 GMT"
	}
} );

// To provide resource-level headers, pass a headers object
// as the second argument to the resource action method:
hc.board.self(
	{ id: 101 },
	{ "If-Match": "8675309" }
).then( function() {
	done();
} );
```

Halon will extend resource-level headers over the client-level headers if a headers object is passed at the resource level (thus it will override headers by the same key at the client level). Halon's `Accept` header value will alway override any other `Accept` header value.

## Wait, What Are You Doing in Addition to HAL?

Our rels contain the HTTP method, and our resources contain and `_origin` property which specifies the url that was hit to return that representation. Note that this will often overlap with `self`, but this will not always be the case. The `_origin` value will be used for optional caching on `GET` requests in the near future.

## Building and Testing

* Be sure to run `npm install` from the root of this project to install dependencies
* To build, run `gulp` in your console at the root of the project
* To test, run npm test in your console at the root of the project

