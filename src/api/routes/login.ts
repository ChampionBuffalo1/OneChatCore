import { Router } from 'express';
import { authBody } from '../../lib/validators/auth';
import { loginUser } from '../controllers/userController';
import { isInvalidMethod, isntAuth, validateSchema } from '../middlewares';

const loginRoute = Router();

loginRoute.post('/', isntAuth, validateSchema(authBody), loginUser);
loginRoute.all('*', isInvalidMethod);

export { loginRoute };
