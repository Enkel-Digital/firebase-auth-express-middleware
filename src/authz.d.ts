import type { Request, RequestHandler } from "express";
import type { auth } from "firebase-admin";

declare function _exports(
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
): RequestHandler;
export = _exports;
