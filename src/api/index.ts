import { Router } from 'express';
import { isInvalidMethod } from './middlewares';
import { loginRoute, singupRoute } from './routes';
import { stableApiVersion } from '../Constants';

const apiRoute = Router();
const routePrefix = `/v${stableApiVersion}`;
apiRoute.use(routePrefix + '/login', loginRoute);
apiRoute.use(routePrefix + '/signup', singupRoute);

// Client side
// apiRoute.get(routePrefix + '/logout', isAuth, (req, res) => {});

apiRoute.all('/', isInvalidMethod);
export default apiRoute;
