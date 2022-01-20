/**
 * Authentication middleware using Firebase Auth
 *
 * Support auth token passed via the Bearer token way
 * Will end the connection in this middleware if there is an error instead of relying on a 500 middleware
 * Request will end if JWT is invalid of if the JWT is missing
 * If authenticated, the decoded JWT will be attached to request for use downstream
 */

// Factory function to setup the middleware
module.exports = function setup(
  firebaseAuth,
  {
    attachUserTo = "authenticatedUser",
    errorJSON = { ok: false },
    errorMessage = (errorObject) => errorObject.message || "UNAUTHORIZED",

    // Allow users to pass in an error handler to deal with every error, for example to log to APM service
    // The object sent back to client on error will also be passed into this function if provided
    errorHandler,
  } = {} // Last argument is optional
) {
  if (!firebaseAuth)
    throw new Error("Firebase Admin auth service MUST BE passed into setup!");

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
   * Apply this middleware to protected routes that require authentication.
   * This middleware allows all users' requests with valid firebase auth tokens through.
   * Thus business logics need to handle extra conditions locally. E.g. user can only request for their own data.
   */
  return async function auth(req, res, next) {
    try {
      // Get auth token if available
      // Note that headers are all lowercased by express
      if (req.headers.authorization) {
        const authHeader = req.headers.authorization.split(" ");

        // Check if the auth header follows the "bearer" pattern
        if (authHeader[0] === "Bearer") {
          // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_the_firebase_admin_sdk
          // The verifyIdToken needs a project ID, but should be taken care of if firebase admin has been initialised properly or runs on gcp infra
          //
          // Attach decoded token to req object to use downstream
          // Users can choose what key to attach the decoded token to.
          req[attachUserTo] = await firebaseAuth.verifyIdToken(authHeader[1]);

          // Break out of this middleware and continue with the next one
          return next();
        }
      }

      // If token missing or token malformed, end the request in this middleware
      // 401 Missing auth token thus unauthorised
      authFailed(res, 401, "MISSING OR MALFORMED AUTH");
    } catch (error) {
      // If verifyIdToken method threw an error, end the request in this middleware
      // Generate the error message first before passing in the final string
      // 403 identity known but denied / failed authentication
      authFailed(res, 403, errorMessage(error));
    }
  };
};
