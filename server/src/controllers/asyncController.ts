import { NextFunction, Request, Response } from "express";

export type NoParams = Record<string, never>;
export type NoQuery = Record<string, never>;
export type NoBody = Record<string, never>;
export type NoResponse = unknown;

export default function asyncController<
  TParams = Record<string, string>,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
>(
  fn: (
    req: Request<TParams, TResponse, TBody, TQuery>,
    res: Response<TResponse>,
    next: NextFunction,
  ) => Promise<void>,
) {
  return (
    req: Request<TParams, TResponse, TBody, TQuery>,
    res: Response<TResponse>,
    next: NextFunction,
  ) => {
    fn(req, res, next).catch(next);
  };
}
