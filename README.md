##halon v0.0.1

###Obligatory Disclaimer
This project is not stable yet - expect *lots* of change. Don't say we didn't warn you. :-)

###What Is It?
Halon is a hypermedia client library for both browser and node.js usage. It attempts to follow the [JSON Hypertext Application Language (HAL)](https://tools.ietf.org/html/draft-kelly-json-hal-06) draft spec, and includes some additional data we feel is important. At LeanKit, we're using it in tandem with [autohost](https://github.com/LeanKit-Labs/autohost/) and [hyped](https://github.com/LeanKit-Labs/hyped/).

###Initializing a Client

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

###Root API
Halon only needs your root API. As it initializes, it will make an `OPTIONS` request against this url, and the options returned from the server will be processed, creating resource methods you can invoke on your client instance. Any resources (and their related "rels") will be available under client._actions. For example, if your server returns an options response like this, the methods `client._actions.user.self` and `client._actions.user.addresses` would be available:

```javascript
{
	"_links": {
        "user:self": {
            "href": "/api/user/{id}",
            "method": "GET",
            "templated": true
        },
        "user:addresses": {
            "href": "/api/user/{id}/address",
            "method": "GET",
            "templated": true
        }
    }
}
```

If you already know ahead of time about any resources that the root `OPTIONS` response will include, you can provide them via the `knownOptions` property on the options passed to halon. This sets up the methods ahead of time, and invoking them results in a request being queued. Once the `OPTIONS` response has been processed, halon internally moves into a `ready` state, and any queued requests will be sent to the server in the order they were queued. This behavior can be helpful in avoiding often-unwieldy "temporal dependency" code, where calls against halon's API would have to be done inside an `onReady` callback.

However, halon does also provide an `onReady` method that notifies you when the `OPTIONS` response has been processed and the client is in a `ready` state:

```javascript
var client = halon( {
	root: "http://server/api",
	adapter: halon.jQueryAdapter($)
} );
client.onReady( function( client ) {
	// Any resources/rels returned as part of the options
	// are know available to invoke under client._actions.
	// The halon client instance is passed as an argument
	// to this callback for convenience.
} );
```

###Getting Resources

Let's say the first thing you want to do, after we've processed our options response, is fetch a user resource, using the "self" rel:

```javascript
// the id here needs to match the templated url id exactly
// (e.g. - /api/user/{id})
client._actions.user.self({ id: 12 }).then(user) {
	// user resource - would contain it's own _actions
	// property for any rels included with the resource.
	// halon takes embedded resources and places them on
	// the parent resource's state, using the embedded key
	// name as the property name. For example, if user
	// addresses were embedded with the user, under the
	// "addresses" key, we could do something like this:
	var toRemove = user.addresses.filter(function(address) {
		return address.city === "Nashville";
	})[0];
	user._actions.deleteAddress({ id: toRemove.id }).then(function(){
		console.log("Buh bye Nashville....");
	});
});
```

You can see from the above example that we can "follow links" that are returned with the root `OPTIONS` response, as well as links included with a returned resource.

###Adapters
Halon does not have an opinion about which XHR abstraction you use. Due to the popularity of jQuery, we include one for `$.ajax`. It looks like this:

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

The function returned takes a `links` object which will look something similar to this example:

```javascript
// a templated example - this means `id` needs to be included
// on the options.data member passed as the second arg to the adapter
{
	href: "/api/user/{id}",
	method: "GET",
	templated: true
}
```

The `options` argument can currently contain `data` and `headers` properties. If we're requesting user ID 34, for example, the `options` argument might look like this (note that halon includes the `Accept` value under `headers` for you by default:

```javascript
{
	data: { id: 34 },
	headers: {
		Accept: "application/hal+json"
	}
}
```

If you are planning to new up several halon client instances, you can specify a default adapter by calling `halon.defaultAdapter()` and passing the default adapter function. After doing this, you won't have to specify an `adapter` property on your options argument unless you're overriding the default you specified.

###Wait, What Are You Doing in Addition to HAL?
Our rels contain the HTTP method, and our resources contain and `_origin` property which specifies the url that was hit to return that representation. Note that this will often overlap with `self`, but this will not always be the case. The `_origin` value will be used for optional caching on `GET` requests in the near future.

###Building and Testing

* Be sure to run `npm install` from the root of this project to install dependencies
* To build, run `gulp` in your console at the root of the project
* To test, run npm test in your console at the root of the project


