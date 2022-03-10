# firebase-auth-express-middleware
An Express JS middleware to simplify writing authentication and authorization logic for API using firebase auth.

1. Use authentication middleware to ensure only requests made with JWT tokens provided by the firebase auth service from logged in users can pass through.
2. Use authorization middleware with a predicate to decide which requests to allow based on the requests' JWT values.
3. The decoded firebase auth token with user data will also be available for you to use downstream in your middlewares and route handlers.


## Prerequisites
This auth middleware requires the [firebase-admin](https://www.npmjs.com/package/firebase-admin) library of version `10.x` as a peer dependency (you just need to install firebase-admin as a normal dependency in the same codebase as where you want to use this middleware).

When using `firebase-admin` library directly, setting it up manually can be quite tedious as you will see in the example below. A much simpler alternative is to use wrapper libraries like <https://www.npmjs.com/package/@enkeldigital/firebase-admin> to setup `firebase-admin` automatically so that you can directly import and start using it.

If you would like to use an older version of firebase-admin library, you would need an older version of this middleware that have some API differences, and importantly only works for authentication and not authorization. You would need to manually handle authorization logic and ending the request yourself. The older version of this library can be found [here](https://www.npmjs.com/package/firebase-auth-express-middleware/v/0.2.1).


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

   You can get your token here (<https://firebase.google.com/docs/auth/admin/verify-id-tokens>) from the client SDK.  
   See [this example](https://github.com/Enkel-Digital/simpler-fetch/blob/master/firebase-auth.md)

2. If an API call is made with a valid token, you can access the decoded token object from request
    ```js
    /* -------------------------------------- Setup firebase -------------------------------------- */
    // Need to setup firebase-admin first with initializeApp method before using this middleware,
    // as the firebase-admin module's auth service needs to be passed into the setup function.
    // The first method is to setup the library manually
    const { initializeApp, applicationDefault } = require("firebase-admin/app");
    initializeApp({ credential: applicationDefault() });
    const { getAuth } = require("firebase-admin/auth");
    const firebaseAuth = getAuth();

    // The second method is much simpler, which is to use a wrapper library like the one below to simplify setup
    // You can directly import and use the default auth service.
    const firebaseAuth = require("@enkeldigital/firebase-admin").auth;

    // Make sure you only use either ONE of the methods to setup firebase admin service!

    /* -------------------------------------- Express App -------------------------------------- */
    const app = require("express")();
    const authMiddleWare = require("firebase-auth-express-middleware");

    // Make all routes in this express app to be authentication protected.
    // Meaning all routes defined later can only be called if a valid JWT is provided.
    // This DOES NOT mean that routes are fully protected yet,
    // as you need to ensure users have sufficient permission to access APIs using authorization middleware.
    app.use(authMiddleWare.authn(firebaseAuth));

    // The actual route that requires both authentication and authorization to run.
    app.get(
        "/data/:organisationID",

        // Add authorization middleware to ensure users can only access data of their own organization.
        // Checks that the specified organizationID in the URL matches user's own organizationID value in their token.
        authMiddleWare.authz((token, req) => token.org === req.params.organisationID),

        // This route handler will only run if the predicate above returns true!
        (req, res) => {
            console.log("Decoded token: ", req.authenticatedUser);

            res.status(200).end();
        }
    );
    ```

3.  If it fails because no JWT was included, you get a 401 code with the following response.
    ```json
        {
            "ok": false,
            "error": "MISSING OR MALFORMED AUTH"
        }
    ```

    If it fails because of an invalid token e.g. wrong signature, you get a 403 code with the following response.
    ```json
        {
            "ok": false,
            "error": "Firebase ID token has invalid signature. See https://firebase.google.com/docs/auth/admin/verify-id-tokens for details on how to retrieve an ID token."
        }
    ```

    If it fails because of you tried to access a resource that you are not authorised to access (predicate failed), you get a 403 code with the following response.
    ```json
        {
            "ok": false,
            "error": "UNAUTHORIZED"
        }
    ```


## Notes
### Attaching decoded token to a custom key on Request object
Since authentication middleware allows you to choose which key to attach the decoded token to using the `attachUserTo` variable during setup, if you would like to use authorization middleware too, then you MUST ensure that they both use the same key to reference the token.

```js
// If you set attachUserTo for the authentication middleware
app.use(authMiddleWare.authn(firebaseAuth, { attachUserTo: "userToken" }));

app.get(
    "/data/:organisationID",

    // You need to set the same value for the authorization middleware to ensure the middleware can find the token
    authMiddleWare.authz((token, req) => token.org === req.params.organisationID, { attachUserTo: "userToken" }),

    (req, res) => {
        console.log("Decoded token: ", req.authenticatedUser);
        res.status(200).end();
    }
);
```

### Why are there 2 middlewares? Why can't it just be one?
The reason why authn and authz are 2 separate middlewares is because, if combined then the parsing auth header code will be repeated every single route, when in practice (most of the time) all if not most routes are authentication protected, with every route using a different function to check if user is authorised.  
So it is easier to have them as 2 seperate middlewares, to apply authentication middleware over all routes, while using specific authorization middlewares for individual route.


## Token (JWT) verification
- Validates JWT using verifyIdTokens method from Firebase Admin's auth service, and attaches decoded token to either req.authenticatedUser or a user specified property.
    - See <https://firebase.google.com/docs/auth/admin/verify-id-tokens>


## License and Author
This project is made available under MIT LICENSE and written by [JJ](https://github.com/Jaimeloeuf)