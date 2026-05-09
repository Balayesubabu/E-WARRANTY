import { Router } from "express";
import createNotificationController from "./create-notification/index.js";

const notificationsRouter = Router();
notificationsRouter.post("/create-notification", createNotificationController);   

export default notificationsRouter;