import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { createMessage, deleteMessage, editMessage, getMessage } from '../controller/messageController';
import { messageCreate, messageEdit, messageFilter } from '../../lib/validators/messageSchema';

// https://expressjs.com/en/4x/api.html#express.router
const messageRouter = Router({
  mergeParams: true
});
// All request to these routes are proctected by `isAuth` middleware in group route

messageRouter.get('/', validateSchema(messageFilter), getMessage);
messageRouter.post('/edit', validateSchema(messageEdit), editMessage);
messageRouter.post('/create', validateSchema(messageCreate), createMessage);
messageRouter.delete('/:message_id', deleteMessage);

export default messageRouter;
