# firebase-auth-express-middleware
[![npm version](https://badge.fury.io/js/firebase-auth-express-middleware.svg)](https://www.npmjs.com/package/firebase-auth-express-middleware)
<span class="badge-patreon"><a href="https://www.patreon.com/jaimeloeuf" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
- An Express JS middleware to simplify the verification process of JWT tokens provided by the firebase auth service.
- Use this to ensure only requests made from users logged in via firebase auth service can pass through.
- User data will also be extracted from the decoded firebase auth token for you to use downstream in your middleware or route handlers.
- You need to setup firebase admin first, running initializeApp before using this middleware, thus the firebaseAdmin module needs to be passed in from the client app to the setup function.

## Installation
```shell
npm install --save firebase-auth-express-middleware
```

## How to use (Sample usage)
View [samples](./samples) folder for more specific examples

1. Now make sure the client's requests have Authorization header. Example being
    ```
    Authorization: Bearer <your-client-token>
    ```

   You can get your token here (https://firebase.google.com/docs/auth/admin/verify-id-tokens) from the client SDK.

2. When requesting, and token is valid, you can get the `user` object from request
    ```js
    router.get('/api/example', (req, res) => {
        res.json({
            message: `You're logged in as ${req.locals.user.email} with Firebase UID: ${req.locals.user.uid}`
        });
    });
    ```

    if it fails, you get the following 401 header and response.
    ```js
        {
            accessDenied: true,
            message: 'Full authentication is required to access this resource.',
            cause: 'NOT AUTHENTICATED'
        }
    ```


## Token (JWT) verification
- Validates the JWT using the verifyIdTokens API from the Firebase Admin SDK and attaches the decoded token to either req.authenticatedUser or a user specified property.
- See <https://firebase.google.com/docs/auth/admin/verify-id-tokens>

## Debug mode
By default, the middleware will log and output to console, you can disable them by setting
your environment variable for `DEBUG` to `false`

## License and Author
This project is made available under MIT © LICENSE
Author(s):
- [JJ](https://github.com/Jaimeloeuf)