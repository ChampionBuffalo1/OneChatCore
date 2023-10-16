import { Router } from 'express';
import messageRouter from './message';
import { isAuth, isInvalidMethod } from '../middlewares';
import { getGroup, joinGroup, leaveGroup, createGroup, deleteGroup } from '../controllers/groupController';

const groupRoute = Router();
groupRoute.use('/:groupId/messages', messageRouter);

groupRoute.get('/', isAuth, getGroup);

groupRoute.post('/join/:groupId', isAuth, joinGroup);

groupRoute.post('/leave/:groupId', isAuth, leaveGroup);

groupRoute.post('/create', isAuth, createGroup);

groupRoute.post('/delete', isAuth, deleteGroup);

groupRoute.all('/', isInvalidMethod);

export { groupRoute };