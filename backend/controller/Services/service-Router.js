import { Router } from "express";
import { createServiceEndpoint } from "./create-service/index.js";
import { getFranchiseServicesEndpoint } from "./get-franchise-services/index.js";
import { servicePackageRouter } from "./Service-Package/service-package-Router.js";
import { updateServiceEndpoint } from "./update-service/index.js";
import multer from "multer";
import { deleteServiceEndpoint } from "./delete-service/index.js";
import { verifyToken } from "../../middleware/verify-token.js";
import { searchServiceByNameEndPoint } from "./search-service-by-name/index.js";
const serviceRouter = Router();
const upload = multer();

serviceRouter.use("/service-package", servicePackageRouter);

serviceRouter.post("/", verifyToken, upload.array("service_icon", 1), createServiceEndpoint);
serviceRouter.post("/search", verifyToken, searchServiceByNameEndPoint);
serviceRouter.get("/", verifyToken, getFranchiseServicesEndpoint);
serviceRouter.put("/:service_id", verifyToken, upload.array("service_icon", 1), updateServiceEndpoint);
serviceRouter.delete("/:service_id", verifyToken, deleteServiceEndpoint);
export { serviceRouter };