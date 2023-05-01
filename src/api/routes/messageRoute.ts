import { Router } from 'express';
import { isAuth, isInvalidMethod } from '../middlewares';

const messageRoute = Router();

// Retrives messsage from database
messageRoute.get('/', (req, res) => {});
// creates new messages in database
messageRoute.post('/', isAuth, (req, res) => {});
// Edits messages in database
messageRoute.patch('/', isAuth, (req, res) => {});
// Deletes messages in database
messageRoute.delete('/', isAuth, (req, res) => {});

messageRoute.all('/', isInvalidMethod);

export { messageRoute };
