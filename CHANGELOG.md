## 0.0.*

### 0.0.3
 * Request adapter should include the correct content-type header
 * Don't throw errors on empty responses (204s for example are valid, empty body responses)
 * Request adapter should not send empty JSON body
 * Add support for submitting arrays as the body of an action
 * Bug fix - don't check empty body for starting { in request adapter

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
