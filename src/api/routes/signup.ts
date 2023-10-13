import { Router } from 'express';
import { authBody } from '../../lib/validators/auth';
import { signupUser } from '../controllers/userController';
import { isntAuth, isInvalidMethod, validateSchema } from '../middlewares';

const singupRoute = Router();

singupRoute.post('/', isntAuth, validateSchema(authBody), signupUser);
singupRoute.all('*', isInvalidMethod);

export { singupRoute };
