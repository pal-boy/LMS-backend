import { Router } from "express";
import { contactUs } from "../controllers/miscellaneous.controller.js";

const contactRouter = Router();

contactRouter.route("/contactUs").post(contactUs);

export default contactRouter;