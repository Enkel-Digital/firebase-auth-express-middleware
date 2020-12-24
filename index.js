/**
 * Auth middleware
 * Using "Firebase Auth" for authentication
 *
 * Support auth token passed via the Bearer token way
 * Will end the connection in this middleware if there is an error instead of relying on a 500 middleware
 * Request will end if JWT is invalid of if the JWT is missing
 * If authenticated, the decoded JWT will be attached to request for use downstream
 */

// Factory function to setup the middleware
module.exports = function setup({
  firebaseAdmin = require("firebase-admin"),

  attachUserTo = "authenticatedUser",

  errorJSON = {
    ok: false,
  },

  errorMessage = (errorObject) => errorObject.message || "UNAUTHORIZED",

  // Allow users to pass in an error handler to deal with every error, for example to log to APM service
  errorHandler,
}) {
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
      // Get auth token if available and if it follows the "bearer" pattern
      // @notice Headers are all lowercased by express
      // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_the_firebase_admin_sdk
      // The verifyIdToken needs a project ID, but should be taken care of if firebase admin has been initialised properly or runs on gcp infra
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        // req[attachUserTo] = await firebaseAdmin
        const decodedToken = await firebaseAdmin
          .auth()
          .verifyIdToken(req.headers.authorization.split(" ")[1]);

        // Attach to req for use downstream
        // Users can choose what key to attach the decoded token to.
        // Store only custom claims if any, and other useful properties
        req[attachUserTo] = {
          uid: decodedToken.uid,
          email: decodedToken.email,
        };

        return next();
      }
      // 401 Missing auth token thus unauthorised
      else
        return res.status(401).json({
          success: false,
          error: "MISSING AUTH",
        });
    } catch (error) {
      // 403 identity known but denied / failed authentication
      res.status(403).json({
        ...errorJSON, // Use the error json passed by user
        error: errorMessage(error), // Generate the error message
      });

      // Run user's custom error handler if any
      if (errorHandler) errorHandler(error);
    }
  };
};

