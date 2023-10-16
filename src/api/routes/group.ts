import { Router } from 'express';
import messageRouter from './message';
import { editGroupProps } from '../../lib/validators/groupvalidator';
import { isAuth, isInvalidMethod, validateSchema } from '../middlewares';
import { getGroup, joinGroup, leaveGroup, createGroup, deleteGroup, editGroup } from '../controllers/groupController';

const groupRoute = Router();
groupRoute.use('/:groupId/messages', messageRouter);

groupRoute.get('/', isAuth, getGroup);

groupRoute.post('/join/:groupId', isAuth, joinGroup);

groupRoute.post('/leave/:groupId', isAuth, leaveGroup);

groupRoute.post('/edit/:groupId', isAuth, validateSchema(editGroupProps), editGroup);

groupRoute.post('/create', isAuth, createGroup);

groupRoute.post('/delete', isAuth, deleteGroup);

groupRoute.all('*', isInvalidMethod);

export { groupRoute };