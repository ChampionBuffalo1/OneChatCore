import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { permissionChange } from '../../lib/validators/memberSchema';
import { changePermission, getCurrentMemberPermission, getGroupMembers } from '../controller/memberController';

const memberRouter = Router({
  mergeParams: true
});

memberRouter.get('/', getGroupMembers);
memberRouter.patch('/permission', validateSchema(permissionChange), changePermission);
memberRouter.get('/permission', getCurrentMemberPermission);

export default memberRouter;
