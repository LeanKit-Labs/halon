## 0.0.*

### Current
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
