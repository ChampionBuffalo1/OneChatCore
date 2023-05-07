import { WsMessageSchema } from './zschema';
import { sendMessage } from './utils';

async function handleMessage(message: WsMessageSchema, token: string) {
  if (message.text.includes('hello')) {
    sendMessage(token, { text: 'Hi' });
  }
}

export { handleMessage };
