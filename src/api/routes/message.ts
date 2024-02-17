import { Router } from 'express';
import { validateSchema } from '../middlewares';
import { messageId, messageQuery, messageText, messageUpdate } from '../../lib/validators/messageSchema';
import { createMessage, deleteMessage, editMessage, getMessage } from '../controller/messageController';

// https://expressjs.com/en/4x/api.html#express.router
const messageRouter = Router({
  mergeParams: true
});
// All request to these routes are proctected by `isAuth` middleware in group route

messageRouter.post('/', validateSchema(messageQuery), getMessage);
messageRouter.post('/edit', validateSchema(messageUpdate), editMessage);
messageRouter.post('/create', validateSchema(messageText), createMessage);
messageRouter.post('/delete', validateSchema(messageId), deleteMessage);

export default messageRouter;
