import { Router } from "express";
import { isAuth, isInvalidMethod } from "./middlewares";
import { loginRoute, singupRoute } from "./routes";
import { noop, HttpCodes, stableApiVersion, cookieName } from "../Constants";

const apiRoute = Router();
const routePrefix = `/v${stableApiVersion}`;
apiRoute.use(routePrefix + "/login", loginRoute);
apiRoute.use(routePrefix + "/v1/signup", singupRoute);

// Temporary (hopefully)
apiRoute.get("/v1/logout", isAuth, (req, res) => {
  req.session.destroy(noop);
  res.clearCookie(cookieName).sendStatus(HttpCodes.OK);
});

apiRoute.all("/", isInvalidMethod);
export default apiRoute;
