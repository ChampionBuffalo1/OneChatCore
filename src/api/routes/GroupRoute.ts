import { Router } from 'express';
import { prisma } from '../../lib';
// import { channelRoute } from './ChannelRoute';
import { isAuth, isInvalidMethod } from '../middlewares';
import { deleteGroup } from '../controllers/groupController';

const groupRoute = Router();

groupRoute.get('/', isAuth, async (req, res) => {
  const data = await prisma.user.findFirst({
    where: {
      id: req.payload.data.userId!
    },
    include: {
      Group: true
    }
  });
  res.status(200).send(data);
});

groupRoute.post('/join/:groupId', isAuth, async (req, res) => {
  const groupId = req.params.groupId;
  const data = await prisma.user.update({
    where: {
      id: req.payload.data.userId!
    },
    data: {
      Group: {
        connect: {
          id: groupId
        }
      }
    },
    include: {
      Group: true
    }
  });
  res.status(200).send(data);
});

groupRoute.post('/join/:groupId', isAuth, async (req, res) => {
  const groupId = req.params.groupId;
  const data = await prisma.user.update({
    where: {
      id: req.payload.data.userId!
    },
    data: {
      Group: {
        disconnect: {
          id: groupId
        }
      }
    },
    include: {
      Group: true
    }
  });
  res.status(200).send(data);
});

// Create new group
// groupRoute.post('/create', isAuth, async (req, res) => {});

//  Delete the group
groupRoute.post('/delete', isAuth, async (req, res) => {
  const groupId = req.body.groupId;
  const group = await deleteGroup(groupId);
  res.status(200).send(group);
});

// groupRoute.use('/channels', channelRoute);

groupRoute.all('/', isInvalidMethod);

export { groupRoute };
