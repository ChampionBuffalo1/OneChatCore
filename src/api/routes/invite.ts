import { Router } from 'express';
import { isAuth, validateSchema } from '../middlewares';
import { inviteSchema } from '../../lib/validators/groupSchema';
import { createInvite, useInvite } from '../controller/inviteController';
import handleBroadcasting from '../../websocket/handleBroadcasting';

const inviteRouter = Router();
inviteRouter.use(isAuth);

inviteRouter.post('/', validateSchema(inviteSchema), createInvite);
inviteRouter.post('/:id/join', useInvite, handleBroadcasting);

export default inviteRouter;
