import { Router } from 'express';
import { loginUser } from '../controllers/userController';
import { isInvalidMethod, isntAuth } from '../middlewares';

const loginRoute = Router();

loginRoute.post('/', isntAuth, loginUser);
loginRoute.all('/', isInvalidMethod);

export { loginRoute };
