### Current

### 0.3.6
* Adding custom LinkMissingError for when a known option is missing its link.
* Fixes issue where a missing link error could not be handled as a promise rejection.

### 0.3.5
Fix AMD path to URITemplate

### 0.3.4
Correct an issue with case sensitivity regarding urijs dependency

### 0.3.3
Expose followResourceLink to API

### 0.3.2
 * Update request adapter to reject request promise on status codes >= 400
 * Include status code as part of rejected promise for request adapter

### 0.3.1
 * Added status code to halon error
 * Add jscs and jshint to build

### 0.3.0
 * Updated jQuery adapter to pass error argument instead of jqXHR arg to rejection handler

### 0.2.1
 * jQuery adapter now prconditionally stringifies JSON data based on if the request is a `POST`, `PATCH`, or `PUT`

### 0.2.0
 * jQuery adapter now will JSON stringify data and add `application/json` Content-Type when data is present. If data is already a string it will be left alone.

### 0.1.0
 * Changed `start` to `connect` which now returns a promise
 * Changed onReady/onReject callbacks to simple `on` event handlers
 * Changed automatic connection behavior to opt-in (vs. opt-out)
 * Removed `_actions` property from top level and resource instances
 * Request adapter should include the correct content-type header
 * Don't throw errors on empty responses (204s for example are valid, empty body responses)
 * Request adapter should not send empty JSON body
 * Add support for submitting arrays as the body of an action
 * Bug fix - don't check empty body for starting { in request adapter
 * Attempting to follow a `knownOption` that does not actually exist after the initial `OPTIONS` call should throw an error
 * Setting `defaultAdapter` now works
 * Removed version from README. Set machina version to 1.x


### 0.0.2
 * Add `onRejected` handler for managing connectivity issues
 * Add support for custom headers at client and request level
 * Add support for query parameters
 * Add support for request
 * Add the ability to submit forms/uploads in request
 * Update README adapters section
 * Bug #6 - allow halon to handle resource list responses
 * Bug #8 - relative roots shouldn't throw an exception

### 0.0.1
Initial release
