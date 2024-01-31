import { Request } from 'express';

export type Nullable<T> = T | null;

export interface RequestBody<T> extends Request {
  body: T;
}

export type PaginatedResponse = {
  currentPage: number;
  totalPages: number;
  skip: number;
  take: number;
};
