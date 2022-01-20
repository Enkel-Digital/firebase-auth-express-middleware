# firebase-auth-express-middleware
An Express JS middleware to simplify writing authentication and authorization logic for API using firebase auth.

1. Use authentication middleware to ensure only requests made with JWT tokens provided by the firebase auth service from logged in users can pass through.
2. Use authorization middleware with a predicate to decide which requests to allow based on the requests' JWT values.
3. The decoded firebase auth token with user data will also be available for you to use downstream in your middlewares and route handlers.


## Installation
```shell
npm install firebase-auth-express-middleware
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
    router.get('/api/example', (req, res) => res.send(`You're logged in as ${req.authenticatedUser.email} with Firebase UID: ${req.authenticatedUser.uid}`));
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
- Validates JWT using verifyIdTokens method from Firebase Admin's auth service, and attaches decoded token to either req.authenticatedUser or a user specified property.
    - See <https://firebase.google.com/docs/auth/admin/verify-id-tokens>

<!-- ## Debug mode -->
<!-- By default, the middleware will log and output to console, you can disable them by setting -->
<!-- your environment variable for `DEBUG` to `false` -->

## License and Author
This project is made available under MIT © LICENSE
Author(s):
- [JJ](https://github.com/Jaimeloeuf)