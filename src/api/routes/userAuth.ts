import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { authBody } from '../../lib/validators/authSchema';
import { loginUser, signupUser } from '../controller/userController';

const authRouter = Router();
authRouter.use(validateSchema(authBody));

// /auth/login
authRouter.post('/login', loginUser);
authRouter.post('/signup', signupUser);

export default authRouter;
