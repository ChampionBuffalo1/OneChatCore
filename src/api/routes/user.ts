import { Router } from 'express';
import upload from '../middlewares/multer';
import { isAuth, validateSchema } from '../middlewares';
import { userPatch } from '../../lib/validators/userSchema';
import handleBroadcasting from '../../websocket/handleBroadcasting';
import { deleteUser, getSelf, userAvatarUpload, userEdit } from '../controller/userController';

const userRouter = Router();
userRouter.use(isAuth);

userRouter.get('/me', getSelf);
userRouter.delete('/', deleteUser);
userRouter.patch('/', validateSchema(userPatch), userEdit, handleBroadcasting);
userRouter.post('/avatar', upload.single('avatar'), userAvatarUpload, handleBroadcasting);

export default userRouter;
