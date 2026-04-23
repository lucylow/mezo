import { Router, type IRouter } from "express";
import healthRouter      from "./health";
import vaultRouter       from "./vault";
import userRouter        from "./user";
import graphqlProxy      from "./graphql-proxy";
import keeperRouter      from "./keeper";
import publicRouter      from "./public";
import partnerRouter     from "./partner";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vaultRouter);
router.use(userRouter);
router.use(graphqlProxy);
router.use(keeperRouter);
router.use(publicRouter);
router.use(partnerRouter);

export default router;
