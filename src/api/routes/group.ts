import { Router } from 'express';
import messageRouter from './message';
import { isAuth, isInvalidMethod, validateSchema } from '../middlewares';
import { editGroupProps, groupName } from '../../lib/validators/groupvalidator';
import { getGroup, joinGroup, leaveGroup, createGroup, deleteGroup, editGroup } from '../controllers/groupController';

const groupRoute = Router();
groupRoute.use('/:groupId/messages', messageRouter);

groupRoute.get('/', isAuth, getGroup);

groupRoute.post('/:groupId/join', isAuth, joinGroup);

groupRoute.post('/:groupId/leave', isAuth, leaveGroup);

groupRoute.post('/:groupId/edit', isAuth, validateSchema(editGroupProps), editGroup);

groupRoute.post('/create', isAuth, validateSchema(groupName), createGroup);

groupRoute.post('/:groupId/delete', isAuth, deleteGroup);

groupRoute.all('*', isInvalidMethod);

export { groupRoute };
