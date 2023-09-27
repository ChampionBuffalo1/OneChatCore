import { Router } from 'express';
import { signupUser } from '../controllers/userController';
import { isntAuth, isInvalidMethod } from '../middlewares';

const singupRoute = Router();

singupRoute.post('/', isntAuth, signupUser);
singupRoute.all('/', isInvalidMethod);

export { singupRoute };
