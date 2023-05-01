import { Router } from 'express';
import { isInvalidMethod } from './middlewares';
import { stableApiVersion } from '../Constants';
import { loginRoute, singupRoute, messageRoute } from './routes';

const apiRoute = Router();
const routePrefix = `/v${stableApiVersion}`;
apiRoute.use(routePrefix + '/login', loginRoute);
apiRoute.use(routePrefix + '/signup', singupRoute);
apiRoute.use(routePrefix + '/messages', messageRoute);

apiRoute.all('/', isInvalidMethod);
export default apiRoute;
