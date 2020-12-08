/**
 * Auth middleware
 * Using "Firebase Auth" for authentication
 */

const admin = require("firebase-admin");

/**
 * Apply this middleware to auth protected routes.
 * This middleware allows all users' requests with valid firebase auth tokens through.
 * Thus business logics need to handle extra conditions locally. E.g. user can only request for their own data.
 */
module.exports = async function auth(req, res, next) {
  try {
    // Get auth token if available and if it follows the "bearer" pattern
    // @notice Headers are all lowercased by express
    // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_the_firebase_admin_sdk
    // The verifyIdToken needs a project ID, but should be taken care of if firebase admin has been initialised properly or runs on gcp infra
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const authToken = req.headers.authorization.split(" ")[1];

      const userInfo = await admin.auth().verifyIdToken(authToken);

      // Attach to req for use downstream
      // Store only custom claims if any, and other useful properties
      req.authenticatedUser = { uid: userInfo.uid, email: userInfo.email };

      return next();
    } else {
      // 401 Missing auth token thus unauthorised
      return res.status(401).json({
        success: false,
        error: "MISSING AUTH",
      });
    }
  } catch (error) {
    // 403 identity known but denied / failed authentication
    return res.status(403).json({
      success: false,
      error: error.message || "UNAUTHORIZED",
    });
  }
};
