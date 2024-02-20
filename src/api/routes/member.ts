import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { permissionChange } from '../../lib/validators/memberSchema';
import { changePermission, getGroupMembers } from '../controller/memberController';

const memberRouter = Router({
  mergeParams: true
});

memberRouter.get('/', getGroupMembers);
memberRouter.patch('/permission', validateSchema(permissionChange), changePermission);

export default memberRouter;
