import { Router } from 'express';
import { isAuth, isInvalidMethod } from './middlewares';
import { stableApiVersion } from '../Constants';
import { loginRoute, singupRoute, groupRoute } from './routes';
import { getUserMetadata } from '../websocket/usermeta';

const apiRoute = Router();
const routePrefix = `/v${stableApiVersion}`;

apiRoute.post(routePrefix + '/@me', isAuth, async (req, res) => {
  const user = await getUserMetadata(req.payload.data.userId!);
  res.status(200).send(user);
});

apiRoute.use(routePrefix + '/login', loginRoute);
apiRoute.use(routePrefix + '/signup', singupRoute);
apiRoute.use(routePrefix + '/group', groupRoute);

apiRoute.all('/', isInvalidMethod);
export default apiRoute;
