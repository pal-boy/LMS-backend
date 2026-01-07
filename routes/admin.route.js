import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
const adminRouter = Router();

adminRouter.route('/stats/users')
.get(isLoggedIn,
    authorizedRoles('ADMIN'),
    getAdminStats);
export default adminRouter;