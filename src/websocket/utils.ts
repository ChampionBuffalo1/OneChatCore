import store from './Store';
import { prisma } from '../lib';

// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
const manualClose = 1010;
// TODO: Remove Buffer or store isBinary in store and attach them for each socket
type BufStr = Buffer | string;

function sendMessage(uuid: string, content: BufStr | Record<string, unknown>, useTmpStore = false): boolean {
  const socket = useTmpStore ? store.getTmpSocket(uuid) : store.getConnection(uuid);
  if (!socket) return false;
  let message = content as BufStr;
  if (typeof content === 'object') message = JSON.stringify(content);
  socket.send(message);
  return true;
}

type MetaInfo = Array<{
  id: string;
  name: string;
  iconUrl: string | null;
  description: string | null;
  messages: Array<{
    id: string;
    text: string;
    author: {
      id: string;
      username: string;
      avatarUrl: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
}>;

async function getUserMetadata(userId: string): Promise<MetaInfo> {
  const metadata = await prisma.member.findMany({
    where: { userId },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
          description: true,
          messages: {
            select: {
              id: true,
              text: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true
                }
              },
              createdAt: true,
              updatedAt: true
            },
            take: 40,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    }
  });
  return metadata.map(data => data.group);
}

export { sendMessage, manualClose, getUserMetadata };
