import { Router } from 'express';
import messageRouter from './message';
import { isAuth, isInvalidMethod } from '../middlewares';
import { getGroup, joinGroup, leaveGroup, makeGroup, removeGroup } from '../controllers/groupController';

const groupRoute = Router();
groupRoute.use('/messages', messageRouter);

groupRoute.get('/', isAuth, getGroup);

groupRoute.post('/join/:groupId', isAuth, joinGroup);

groupRoute.post('/leave/:groupId', isAuth, leaveGroup);

groupRoute.post('/create', isAuth, makeGroup);

groupRoute.post('/delete', isAuth, removeGroup);

groupRoute.all('/', isInvalidMethod);

export { groupRoute };