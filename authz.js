/**
 * Authorization middleware using Firebase Auth
 */

// Factory function to setup the middleware
module.exports = function setup(
  predicate,
  {
    attachUserTo = "authenticatedUser",
    errorJSON = { ok: false },
    errorMessage = (errorObject) => errorObject.message || "UNAUTHORIZED",
    errorHandler, // Allow users to pass in an error handler to deal with every error, for example to log to APM service
  } = {} // Last argument is optional
) {
  // Assume that it can only be a string or function
  if (typeof errorMessage !== "function")
    if (typeof errorMessage === "string") errorMessage = () => errorMessage;
    else
      throw new Error("Only Functions or Strings are allowed for errorMessage");

  /**
   * Apply this middleware to auth protected routes.
   * This middleware allows all users' requests with valid firebase auth tokens through.
   * Thus business logics need to handle extra conditions locally. E.g. user can only request for their own data.
   */
  return async function auth(req, res, next) {
    try {
      // Attach decoded token to req object to use downstream
      // Users can choose what key to attach the decoded token to.
      //
      // If predicate returns true with the given claims, user is authorized to access resource, call next middleware
      // Predicate must return true or false, does not accept truthy values in place of true
      // Break out of this middleware and continue with the next one
      if ((await predicate(req[attachUserTo])) === true) return next();

      // Else if predicate failed, means user is unauthorised to access resource,
      // end the request in this middleware with 403 unauthorised
      // 403 identity known but denied / unauthorised
      return res.status(403).json({
        ok: false,
        error: "UNAUTHORIZED",
      });
    } catch (error) {
      // 403 identity known but denied / unauthorised
      res.status(403).json({
        ok: false,
        error: errorMessage(error), // Generate the error message

        // Use the error json passed by user
        // Use this after the standard keys so that user's error JSON can override it
        ...errorJSON,
      });

      // Run user's custom error handler if any
      if (errorHandler) errorHandler(error);
    }
  };
};
