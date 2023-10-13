import { Router } from 'express';
import { isAuth, isInvalidMethod, validateSchema } from '../middlewares';
import { messageId, messageQuery, messageText, messageUpdate } from '../../lib/validators/msgvalidator';
import { createMessage, deleteMessage, editMessage, getMessage } from '../controllers/messageController';

// https://expressjs.com/en/4x/api.html#express.router
const messageRouter = Router({
  mergeParams: true
});

messageRouter.post('/', validateSchema(messageQuery), getMessage);
messageRouter.post('/edit', isAuth, validateSchema(messageUpdate), editMessage);
messageRouter.post('/create', isAuth, validateSchema(messageText), createMessage);
messageRouter.post('/delete', isAuth, validateSchema(messageId), deleteMessage);

messageRouter.all('*', isInvalidMethod);
export default messageRouter;
