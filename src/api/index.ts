import { prisma } from '../lib';
import { Router } from 'express';
import { stableApiVersion } from '../Constants';
import { isAuth, isInvalidMethod } from './middlewares';
import { loginRoute, singupRoute, groupRoute } from './routes';

const apiRoute = Router();
const routePrefix = `/v${stableApiVersion}`;

apiRoute.post(routePrefix + '/@me', isAuth, async (req, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.payload.data.userId
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true
    }
  });
  res.status(200).jsonp(user);
});

apiRoute.use(routePrefix + '/login', loginRoute);
apiRoute.use(routePrefix + '/signup', singupRoute);
apiRoute.use(routePrefix + '/group', groupRoute);

apiRoute.all('/', isInvalidMethod);
export default apiRoute;
