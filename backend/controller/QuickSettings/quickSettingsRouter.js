import express from "express";
import {  getQuickSettingsEndPoint } from "./getQuickSetting.js/index.js";
import {createOrUpdateQuickSettingsEndPoint} from "./updateQuickSetting.js/index.js"
import { verifyToken } from "../../middleware/verify-token.js";

const quickSettingsRouter = express.Router();

quickSettingsRouter.post("/create-quick-settings", verifyToken, createOrUpdateQuickSettingsEndPoint);
quickSettingsRouter.get("/get-quick-settings", verifyToken, getQuickSettingsEndPoint);

export default quickSettingsRouter;
