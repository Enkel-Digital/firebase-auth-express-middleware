/**
 * Authorization middleware using Firebase Auth
 */

// Factory function to setup the middleware
module.exports = function setup(
  predicate,
  {
    attachUserTo = "authenticatedUser",

    // @todo SHold this only be set when the auth fail? Or when it errors out? Or both?
    errorJSON = { ok: false },

    // @todo This cannot be async and it cannot throw!!
    errorMessage = (errorObject) => errorObject.message || "UNAUTHORIZED",

    // Allow users to pass in an error handler to deal with every error, for example to log to APM service
    // The object sent back to client on error will also be passed into this function if provided
    errorHandler,
  } = {} // Last argument is optional
) {
  // Assume that it can only be a string or function
  if (typeof errorMessage !== "function")
    if (typeof errorMessage === "string") errorMessage = () => errorMessage;
    else
      throw new Error("Only Functions or Strings are allowed for errorMessage");

  // Create function used to end request in this middleware and call error handler if any
  function authFailed(res, status, error) {
    res.status(status).json({
      error,

      // No need to set ok: false as this is the default value in errorJSON

      // Use the error json passed by user
      // Use this after the standard keys so that user's error JSON can override it
      ...errorJSON,
    });

    // @todo errorMessage function CANNOT BE ASYNCHRONOUS... and it cannot throw!! If the fn throws then it will crash the express app
    // Run user's custom error handler if any
    if (errorHandler) {
      // Set status onto object too so that user's error handler can have access to it
      resObj.status = status;
      errorHandler(resObj);
    }
  }

  /**
   * Apply this middleware to protected routes that require authorization.
   * This middleware allows all users' requests that passes the authorization predicate through.
   * Business logics to handle authorization like 'user can only request for own data' should be written in the predicate.
   */
  return async function auth(req, res, next) {
    try {
      // Get the attached decoded token on the req object.
      // Since users can choose what key to attach the decoded token to in authentication middleware,
      // users need to specify the key again for authorization middleware to be able to access it.
      //
      // If predicate returns true with the given claims and request object,
      // user is authorized to access resource, thus call next middleware.
      // Predicate must return true or false, does not accept truthy values in place of true
      // Break out of this middleware and continue with the next one
      if (req[attachUserTo])
        if ((await predicate(req[attachUserTo], req)) === true) return next();

      // Else if predicate failed, means user is unauthorised to access resource,
      // end the request in this middleware with 403 unauthorised
      // 403 identity known but denied / unauthorised
      authFailed(res, 403, "UNAUTHORIZED");
    } catch (error) {
      // If predicate function threw an error, end the request in this middleware
      // Generate the error message first before passing in the final string
      // 403 identity known but denied / failed authentication
      authFailed(res, 403, errorMessage(error));
    }
  };
};
