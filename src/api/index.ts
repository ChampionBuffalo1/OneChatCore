import { Router } from 'express';
import userRouter from './routes/user';
import groupRoute from './routes/group';
import authRouter from './routes/userAuth';

const apiRoute = Router();

apiRoute.use('/user', userRouter);
apiRoute.use('/auth', authRouter);
apiRoute.use('/group', groupRoute);

export default apiRoute;
