import { Router } from 'express';
import { isAuth, validateSchema } from '../middlewares';
import { userPatch } from '../../lib/validators/userSchema';
import { deleteUser, getSelf, userEdit } from '../controller/userController';

const userRouter = Router();
userRouter.use(isAuth);

userRouter.get('/me', getSelf);
userRouter.patch('/', validateSchema(userPatch), userEdit);
userRouter.delete('/', deleteUser);

export default userRouter;
