import { Router } from 'express';
import memberRouter from './member';
import messageRouter from './message';
import upload from '../middlewares/multer';
import { isAuth, validateSchema } from '../middlewares';
import handleBroadcasting from '../../websocket/handleBroadcasting';
import { groupCreateSchema } from '../../lib/validators/groupSchema';
import { leaveGroup, createGroup, deleteGroup, groupIconChange, getGroups } from '../controller/groupController';

const groupRoute = Router();
// All routes and subroutes are auth protected
groupRoute.use(isAuth);

groupRoute.use('/:id/member', memberRouter);
groupRoute.use('/:id/message', messageRouter);

groupRoute.get('/', getGroups);
groupRoute.post('/:id/leave', leaveGroup);
groupRoute.delete('/:id/delete', deleteGroup);
groupRoute.post('/:id/icon', upload.single('icon'), groupIconChange);
groupRoute.post('/create', validateSchema(groupCreateSchema), createGroup);

groupRoute.use(handleBroadcasting);

export default groupRoute;
