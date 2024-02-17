import { Router } from 'express';
import roleRouter from './role';
import messageRouter from './message';
import { isAuth, validateSchema } from '../middlewares';
import handleBroadcasting from '../../websocket/handleBroadcasting';
import { groupCreateSchema } from '../../lib/validators/groupSchema';
import { leaveGroup, createGroup, deleteGroup } from '../controller/groupController';

const groupRoute = Router();
// All routes and subroutes are auth protected
groupRoute.use(isAuth);

groupRoute.use('/:id/role', roleRouter);
groupRoute.use('/:id/message', messageRouter);

groupRoute.post('/:id/leave', leaveGroup);
groupRoute.delete('/:id/delete', deleteGroup);
groupRoute.post('/create', validateSchema(groupCreateSchema), createGroup);

groupRoute.use(handleBroadcasting);

export default groupRoute;
