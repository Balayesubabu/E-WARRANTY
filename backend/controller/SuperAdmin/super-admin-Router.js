import { Router } from "express";
import { verifySuperAdminToken } from "../../middleware/verify-token.js";
import superAdminLoginEndpoint from "./super-admin-login/index.js";
import dashboardStatsEndpoint from "./dashboard-stats/index.js";
import providersListEndpoint from "./providers-list/index.js";
import providerDetailEndpoint from "./provider-detail/index.js";
import {
    dealerDeactivateEndpoint,
    dealerActivateEndpoint,
} from "./dealer-activate/index.js";
import {
    staffDeactivateEndpoint,
    staffActivateEndpoint,
} from "./staff-activate/index.js";
import {
    serviceCenterDeactivateEndpoint,
    serviceCenterActivateEndpoint,
} from "./service-center-activate/index.js";
import blockProviderEndpoint from "./block-provider/index.js";
import unblockProviderEndpoint from "./unblock-provider/index.js";
import {
    getProviderCoinsEndpoint,
    addCoinsEndpoint,
    deductCoinsEndpoint,
} from "./manage-coins/index.js";
import { changePasswordEndpoint } from "./change-password/index.js";
import {
    getCoinPricingEndpoint,
    updateCoinPricingEndpoint,
} from "./coin-pricing/index.js";
import { getActivityLogsEndpoint } from "./activity-logs/index.js";
import warrantyRegistrationsChartEndpoint from "./warranty-registrations-chart/index.js";
import warrantyCodesEndpoint from "./warranty-codes/index.js";
import exportWarrantyCodesCsvEndpoint from "./warranty-codes/export-csv.js";
import {
    warrantyRegistrationsListEndpoint,
    exportWarrantyRegistrationsCsvEndpoint,
} from "./warranty-registrations/index.js";
import searchEndpoint from "./search/index.js";
import notificationsEndpoint from "./notifications/index.js";

const superAdminRouter = Router();

// Public - login only
superAdminRouter.post("/login", superAdminLoginEndpoint);

// Protected - all other routes require Super Admin token
superAdminRouter.get("/dashboard-stats", verifySuperAdminToken, dashboardStatsEndpoint);
superAdminRouter.get("/providers", verifySuperAdminToken, providersListEndpoint);
superAdminRouter.get("/providers/:id/detail", verifySuperAdminToken, providerDetailEndpoint);
superAdminRouter.put("/providers/:providerId/dealers/:dealerId/deactivate", verifySuperAdminToken, dealerDeactivateEndpoint);
superAdminRouter.put("/providers/:providerId/dealers/:dealerId/activate", verifySuperAdminToken, dealerActivateEndpoint);
superAdminRouter.put("/providers/:providerId/staff/:staffId/deactivate", verifySuperAdminToken, staffDeactivateEndpoint);
superAdminRouter.put("/providers/:providerId/staff/:staffId/activate", verifySuperAdminToken, staffActivateEndpoint);
superAdminRouter.put("/providers/:providerId/service-centers/:serviceCenterId/deactivate", verifySuperAdminToken, serviceCenterDeactivateEndpoint);
superAdminRouter.put("/providers/:providerId/service-centers/:serviceCenterId/activate", verifySuperAdminToken, serviceCenterActivateEndpoint);
superAdminRouter.put("/providers/:id/block", verifySuperAdminToken, blockProviderEndpoint);
superAdminRouter.put("/providers/:id/unblock", verifySuperAdminToken, unblockProviderEndpoint);
superAdminRouter.get("/providers/:id/coins", verifySuperAdminToken, getProviderCoinsEndpoint);
superAdminRouter.post("/providers/:id/coins/add", verifySuperAdminToken, addCoinsEndpoint);
superAdminRouter.post("/providers/:id/coins/deduct", verifySuperAdminToken, deductCoinsEndpoint);
superAdminRouter.post("/change-password", verifySuperAdminToken, changePasswordEndpoint);
superAdminRouter.get("/coin-pricing", verifySuperAdminToken, getCoinPricingEndpoint);
superAdminRouter.put("/coin-pricing", verifySuperAdminToken, updateCoinPricingEndpoint);
superAdminRouter.get("/activity-logs", verifySuperAdminToken, getActivityLogsEndpoint);
superAdminRouter.get("/warranty-registrations-chart", verifySuperAdminToken, warrantyRegistrationsChartEndpoint);
superAdminRouter.get("/warranty-registrations/export", verifySuperAdminToken, exportWarrantyRegistrationsCsvEndpoint);
superAdminRouter.get("/warranty-registrations", verifySuperAdminToken, warrantyRegistrationsListEndpoint);
superAdminRouter.get("/warranty-codes/export", verifySuperAdminToken, exportWarrantyCodesCsvEndpoint);
superAdminRouter.get("/warranty-codes", verifySuperAdminToken, warrantyCodesEndpoint);
superAdminRouter.get("/search", verifySuperAdminToken, searchEndpoint);
superAdminRouter.get("/notifications", verifySuperAdminToken, notificationsEndpoint);

export default superAdminRouter;
