import { Request } from 'express';

export type Nullable<T> = T | null;

export interface RequestBody<T> extends Request {
  body: T;
}

export interface RequestQuery<T> extends Request {
  query: T;
}
