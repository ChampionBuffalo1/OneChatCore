import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { getPermission, permissionChange } from '../../lib/validators/memberSchema';
import { changePermission, getCurrentMemberPermission, getGroupMembers } from '../controller/memberController';

const memberRouter = Router({
  mergeParams: true
});

memberRouter.get('/', getGroupMembers);
memberRouter.patch('/permission', validateSchema(permissionChange), changePermission);
memberRouter.post('/permission', validateSchema(getPermission), getCurrentMemberPermission);

export default memberRouter;
