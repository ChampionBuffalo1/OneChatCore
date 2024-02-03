import { Prisma } from '@prisma/client';
import { Logger, errorResponse } from '../../lib';
import type { Request, Response, NextFunction } from 'express';

const INTERNAL_SERVICE = errorResponse({
  code: 'SERVICE_ERROR',
  message: 'An unknown error occured!'
});

export function prismaHandler(err: Error, req: Request, _res: Response, next: NextFunction): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    Logger.error(
      `Unhandled Prisma Client Error ${err.code} at route ${req.method} ${req.url} with message: ${err.message}`
    );
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    Logger.error(`Unknown Prisma Client Error at route ${req.method} ${req.url} with message: ${err.message}`);
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    Logger.error(`Prisma Engine Panic while serving at route ${req.method} ${req.url} with message: ${err.message}`);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    Logger.error(`Prisma Validation Failed at route ${req.method} ${req.url} with message: ${err.message}`);
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    Logger.error(
      `Prisma Client Initialization Failed at route ${req.method} ${req.url} with code: ${err.errorCode} and message: ${err.message}`
    );
  } else {
    Logger.error(
      `Unknown Error on route "${req.method} ${req.url}": ${err.message + '\n' + (err.stack !== undefined ? err.stack : '')}`
    );
  }
  next(err);
}

export function unknownHandler(_err: Error, _req: Request, res: Response, _next: NextFunction): void {
  res.status(500).json(INTERNAL_SERVICE);
}
