import type { RequestHandler } from "express";
import type { auth } from "firebase-admin";

declare function _exports(
  firebaseAuth: auth.Auth,
  {
    checkRevoked,
    attachUserTo,
    errorJSON,
    errorMessage,
    errorHandler,
  }?: {
    checkRevoked?: boolean;
    attachUserTo?: string;
    errorJSON?: {
      ok: boolean;
    };
    errorMessage?: (errorObject: Error) => string;
    errorHandler: Function;
  }
): RequestHandler;
export = _exports;
