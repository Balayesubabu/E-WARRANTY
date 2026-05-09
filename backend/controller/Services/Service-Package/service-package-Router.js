import { Router } from "express";
import { createPackageEndpoint } from "./create-package/index.js";
import { getFranchisePackageEndpoint } from "./get-franchise-package/index.js";
import { getPackageEndpoint } from "./get-package/index.js";
import { updatePackageEndpoint } from "./update-package/index.js";
import { deletePackageEndpoint } from "./delete-package/index.js";
import {searchServicePackageByNameEndpoint} from "./seach-service-package-by-name/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
const servicePackageRouter = Router();

servicePackageRouter.post("/", verifyToken, createPackageEndpoint);
servicePackageRouter.get("/:package_id", verifyToken, getPackageEndpoint);
servicePackageRouter.get("/franchise/:franchise_id", verifyToken, getFranchisePackageEndpoint);
servicePackageRouter.put("/:package_id", verifyToken, updatePackageEndpoint);
servicePackageRouter.delete("/:package_id", verifyToken, deletePackageEndpoint);
servicePackageRouter.post("/search-package", verifyToken, searchServicePackageByNameEndpoint);


export { servicePackageRouter };