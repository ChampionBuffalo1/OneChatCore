import type { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../../lib/response';

export default function validateSchema(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parsedBody = await schema.spa(req.body);
    if (parsedBody.success) {
      next();
    } else {
      const errors = parsedBody.error.issues.map(issue => ({
        param: issue.path[0] as string,
        message: issue.message,
        code: 'INVALID_INPUT'
      }));
      res.status(400).json(errorResponse(errors));
    }
  };
}
