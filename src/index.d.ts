import type { Request, RequestHandler } from "express";
import type { auth } from "firebase-admin";

export const authn: (
  firebaseAuth: auth.Auth,
  {
    attachUserTo,
    errorJSON,
    errorMessage,
    errorHandler,
  }?: {
    attachUserTo?: string;
    errorJSON?: {
      ok: boolean;
    };
    errorMessage?: (errorObject: Error) => string;
    errorHandler: Function;
  }
) => RequestHandler;

export const authz: (
  predicate: (token: auth.DecodedIdToken, req: Request) => boolean,
  {
    attachUserTo,
    errorJSON,
    errorMessage,
    errorHandler,
  }?: {
    attachUserTo?: string;
    errorJSON?: {
      ok: boolean;
    };
    errorMessage?: (errorObject: Error) => string;
    errorHandler: Function;
  }
) => RequestHandler;
