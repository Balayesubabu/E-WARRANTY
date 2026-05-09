import { Router } from "express";
import { landingContactEndpoint } from "./landing-contact/index.js";

const publicRouter = Router();

publicRouter.post("/contact-inquiry", landingContactEndpoint);

export default publicRouter;
