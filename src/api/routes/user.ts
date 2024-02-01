import { Router } from 'express';
import { isAuth } from '../middlewares';
import { getSelf } from '../controller/userController';

const userRouter = Router();
userRouter.use(isAuth);

userRouter.get('/me', getSelf);

export default userRouter;
