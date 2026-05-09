import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Onboarding } from './components/onboarding/Onboarding';
import { Login } from './components/auth/Login';
import { RegisterPage } from './components/auth/RegisterPage';
import { OwnerSignUp } from './components/auth/OwnerSignUp';
import { EmailForOtp } from './components/common/EmailForOtp';
import { ChangePassword } from './components/common/ChangePassword';
import { SignUp } from './components/auth/SignUp';
import { CustomerAuth } from './components/auth/CustomerAuth';
import { Home } from './components/dashboard/Home';
import { RegisterProduct } from './components/warranty/RegisterProduct';
import { ActivateWarranty } from './components/warranty/ActivateWarranty';
import { VerifyWarranty } from './components/warranty/VerifyWarranty';
import { CheckWarrantyStatus } from './components/warranty/CheckWarrantyStatus';
import { TermsOfService } from './components/legal/TermsOfService';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { WarrantyDetailsPage } from './components/warranty/WarrantyDetailsPage';
import { Analytics } from './components/analytics/Analytics';
import { Profile } from './components/profile/Profile';
import { EditProfile } from './components/profile/EditProfile';
import { FirstLandPage } from './pages/FirstLandPage';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ApiSalesPage } from './pages/ApiSalesPage';
import { UserGuide } from './pages/UserGuide';
import { Toaster } from './components/ui/sonner';
import { OTPVerification } from './components/auth/OTPVerification';
import { DealerManagement } from './components/owner/DealerManagement';
import { DealerProfile } from './components/owner/DealerProfile';
import { StaffProfilePage } from './components/owner/StaffProfilePage';
import { StaffManagement } from './components/owner/StaffManagement';
import { ApprovalQueue } from './components/dealer/ApprovalQueue';
import { NotificationCenter } from './components/common/NotificationCenter';
import { CustomerSelfRegister } from './components/customer/CustomerSelfRegister';
import { WarrantyCertificate } from './components/customer/WarrantyCertificate';
import { WarrantyPolicies } from './components/owner/WarrantyPolicies';
import { WarrantyBatches } from './components/owner/WarrantyBatches';
import { WarrantySettings } from './components/owner/WarrantySettings';
import { SubscriptionPlans } from './components/owner/SubscriptionPlans';
import { ActivityLogs } from './components/owner/ActivityLogs';
import { WarrantyClaimManagement } from './components/owner/WarrantyClaimManagement';
import { OwnerCustomers } from './components/owner/OwnerCustomers';
import { OwnerCustomerDetail } from './components/owner/OwnerCustomerDetail';
import { OwnerProfile as OwnerProfilePage } from './components/owner/OwnerProfile';
import { OwnerLayout } from './components/layout/OwnerLayout';
import { OwnerOverview } from './components/dashboard/OwnerOverview';
import { OwnerPurchaseOrders } from './components/owner/OwnerPurchaseOrders';
import { OwnerInventoryMovement } from './components/owner/OwnerInventoryMovement';
import { OwnerWarrantyRegistry } from './components/owner/OwnerWarrantyRegistry';
import { OwnerDealerLedger } from './components/owner/OwnerDealerLedger';
import { OwnerPaymentRecords } from './components/owner/OwnerPaymentRecords';
import { OwnerProductMaster } from './components/owner/OwnerProductMaster';
import { AddWarrantyProductWizard } from './components/owner/AddWarrantyProductWizard';
import { WarrantySetup } from './components/owner/WarrantySetup';
import { WarrantyProducts } from './components/owner/WarrantyProducts';
import { ProductViewAll } from './components/owner/ProductViewAll';
import { ProductDetail } from './components/owner/ProductDetail';
import { ProductBatchDetail } from './components/owner/ProductBatchDetail';
import  GenerateWarrantyQRCodes  from './components/owner/GenerateWarrantyQRCodes';
import { DealerLayout } from './components/layout/DealerLayout';
import { DealerDashboard } from './components/dealer/DealerDashboard';
import { DealerInventory } from './components/dealer/DealerInventory';
import { DealerPurchaseHistory } from './components/dealer/DealerPurchaseHistory';
import { DealerSalesEntry } from './components/dealer/DealerSalesEntry';
import { DealerClaimsManagement } from './components/dealer/DealerClaimsManagement';
import { DealerWarrantyClaims } from './components/dealer/DealerWarrantyClaims';
import { DealerWarrantyCodes } from './components/dealer/DealerWarrantyCodes';
import { DealerPayments } from './components/dealer/DealerPayments';
import { DealerBusinessProfile } from './components/dealer/DealerBusinessProfile';
import { WarrantyClaims } from './components/staff/WarrantyClaims';
import { SupportTickets } from './components/staff/SupportTickets';
import { StaffChangePassword } from './components/staff/StaffChangePassword';
import { StaffEditProfile } from './components/staff/StaffEditProfile';
import { StaffClaimManagement } from './components/staff/StaffClaimManagement';
import { StaffWarrantyLookup } from './components/staff/StaffWarrantyLookup';
import { StaffLayout } from './components/layout/StaffLayout';
import { ServiceCenterLayout } from './components/layout/ServiceCenterLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { ServiceCenterClaims } from './components/servicecenter/ServiceCenterClaims';
import { ServiceCenterDashboard } from './components/servicecenter/ServiceCenterDashboard';
import { ServiceCenterProfile } from './components/servicecenter/ServiceCenterProfile';
import { ServiceCenterChangePassword } from './components/servicecenter/ServiceCenterChangePassword';
import { SuperAdminLogin } from './components/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { SuperAdminProviders } from './components/superadmin/SuperAdminProviders';
import { SuperAdminProviderDetail } from './components/superadmin/SuperAdminProviderDetail';
import { SuperAdminManageCoins } from './components/superadmin/SuperAdminManageCoins';
import { SuperAdminCoinPricing } from './components/superadmin/SuperAdminCoinPricing';
import { SuperAdminChangePassword } from './components/superadmin/SuperAdminChangePassword';
import { SuperAdminActivityLogs } from './components/superadmin/SuperAdminActivityLogs';
import { SuperAdminWarrantyCodes } from './components/superadmin/SuperAdminWarrantyCodes';
import { SuperAdminWarrantyRegistrations } from './components/superadmin/SuperAdminWarrantyRegistrations';
import { ServiceCenterManagement } from './components/owner/ServiceCenterManagement';
import { StaffHome } from './components/dashboard/StaffHome';
import { DealerChangePassword } from './components/dealer/DealerChangePassword';
import { DealerEditProfile } from './components/dealer/DealerEditProfile';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleProtectedRoute } from './components/common/RoleProtectedRoute';
import { BuyCoins, CoinHistory, Wallet, BuyWarrantyCodes } from './components/coins';
import Cookies from 'js-cookie';


function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  const token = Cookies.get('authToken');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
  
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/old-landing" element={<FirstLandPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/api-sales" element={<ApiSalesPage />} />
        <Route path="/register-account" element={<RegisterPage />} />
        <Route path="/owner-login" element={<Navigate to="/login" replace />} />
        <Route path="/staff-login" element={<Navigate to="/login" replace />} />
        <Route path="/dealer-login" element={<Navigate to="/login" replace />} />
        <Route path="/service-center-login" element={<Navigate to="/login" replace />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/owner-signup" element={<OwnerSignUp />} />
        <Route path="/email-for-otp" element={<EmailForOtp />} />
        <Route path="/customer-auth" element={<CustomerAuth />} />
        <Route path="/signup" element={<Navigate to="/customer-auth" replace />} />
        <Route path="/otp" element={<OTPVerification />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/check-warranty" element={<CheckWarrantyStatus />} />
        <Route path="/user-guide" element={<UserGuide />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/dashboard" element={<Onboarding />} />

        {/* Protected routes - accessible to all authenticated users */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          }
        />

        {/* QR code activation - public, token-based */}
        <Route path="/activate/:token" element={<ActivateWarranty />} />

        {/* Verify warranty - public routes, OTP acts as authentication */}
        <Route path="/verify" element={<VerifyWarranty />} />
        <Route path="/warranty-details" element={<WarrantyDetailsPage />} />

        {/* Shared routes - owner and staff can both verify and view analytics */}
        <Route
          path="/analytics"
          element={
            <RoleProtectedRoute allowedRoles={['owner', 'staff', 'dealer']}>
              <Analytics />
            </RoleProtectedRoute>
          }
        />

        {/* Customer routes */}
        <Route
          path="/register"
          element={
            <RoleProtectedRoute allowedRoles={['customer', 'owner', 'dealer']}>
              <RegisterProduct />
            </RoleProtectedRoute>
          }
        />
        {/* Public warranty registration - no login required */}
        <Route path="/customer-register" element={<CustomerSelfRegister />} />
        <Route
          path="/certificate"
          element={
            <RoleProtectedRoute allowedRoles={['customer', 'owner']}>
              <WarrantyCertificate />
            </RoleProtectedRoute>
          }
        />

        {/* Owner layout with persistent sidebar - all sub-pages nested */}
        <Route
          path="/owner" 
          element={
            <RoleProtectedRoute allowedRoles={['owner']}>
              <OwnerLayout />
            </RoleProtectedRoute>
          }
        >
          {/* Overview */}
          <Route index element={<OwnerOverview />} />

          {/* Distribution */}
          <Route path="purchase-orders" element={<OwnerPurchaseOrders />} />
          <Route path="inventory" element={<OwnerInventoryMovement />} />

          {/* Warranty Management */}
          <Route path="warranty-registry" element={<OwnerWarrantyRegistry />} />
          <Route path="claims-management" element={<WarrantyClaimManagement />} />

          {/* Finance */}
          <Route path="dealer-ledger" element={<OwnerDealerLedger />} />
          <Route path="payment-records" element={<OwnerPaymentRecords />} />

          {/* Reports & Analytics */}
          <Route path="analytics" element={<Analytics />} />

          {/* Product Management */}
          <Route path="warranty-setup" element={<WarrantySetup />} />
          <Route path="warranty-management/batch/:batchId" element={<ProductBatchDetail />} />
          <Route path="warranty-management/product/:productId" element={<ProductDetail />} />
          <Route path="warranty-management" element={<ProductViewAll />} />
          <Route path="warranty-products" element={<WarrantyProducts />} />
          <Route path="add-warranty-product" element={<AddWarrantyProductWizard />} />
          <Route path="product-master" element={<OwnerProductMaster />} />
          <Route path="warranty-policies" element={<WarrantyPolicies />} />
          <Route path="warranty-batches" element={<WarrantyBatches />} />

          {/* Owner profile inside console layout */}
          <Route path="profile" element={<OwnerProfilePage />} />

          {/* People & Operations */}
          <Route path="dealer-management" element={<DealerManagement />} />
          <Route path="dealer-management/:dealerId" element={<DealerProfile />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/:staffId" element={<StaffProfilePage />} />
          <Route path="service-centers" element={<ServiceCenterManagement />} />
          <Route path="customers" element={<OwnerCustomers />} />
          <Route path="customers/:customerId" element={<OwnerCustomerDetail />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="subscription" element={<SubscriptionPlans />} />
          <Route path="warranty-settings" element={<WarrantySettings />} />
          <Route path="notifications" element={<NotificationCenter />} />
          
          {/* Coins System - Simplified Wallet */}
          <Route path="wallet" element={<Wallet />} />
          <Route path="buy-warranty-codes" element={<BuyWarrantyCodes />} />
          <Route path="coins" element={<CoinHistory />} />
          {/* Legacy route - redirect to wallet */}
          <Route path="buy-coins" element={<Wallet />} />

          {/* Legacy redirects for old routes */}
          <Route path="claim-management" element={<Navigate to="/owner/claims-management" replace />} />
          <Route path="warranty-claims" element={<Navigate to="/owner/claims-management" replace />} />
          <Route path="bulk-upload" element={<Navigate to="/owner/warranty-batches" replace />} />
        </Route>

        {/* Staff layout with persistent sidebar - all sub-pages nested */}
        <Route
          path="/staff"
          element={
            <RoleProtectedRoute allowedRoles={['staff']}>
              <StaffLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<StaffHome />} />
          <Route path="warranty-claims" element={<WarrantyClaims />} />
          <Route path="claim-management" element={<StaffClaimManagement />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="verify" element={<StaffWarrantyLookup />} />
          <Route path="register" element={<RegisterProduct />} />
          <Route path="generate-qr" element={<GenerateWarrantyQRCodes />} />
          <Route path="dealers" element={<DealerManagement />} />
          <Route path="customers" element={<OwnerCustomers />} />
          <Route path="customers/:customerId" element={<OwnerCustomerDetail />} />
          <Route path="reports" element={<Analytics />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="edit-profile" element={<StaffEditProfile />} />
          <Route path="change-password" element={<StaffChangePassword />} />
          <Route path="warranty-settings" element={<WarrantySettings />} />
        </Route>

        {/* Legacy staff routes - redirect to new paths */}
        <Route path="/warranty-claims" element={<Navigate to="/staff/warranty-claims" replace />} />
        <Route path="/support-tickets" element={<Navigate to="/staff/support-tickets" replace />} />
        <Route path="/staff-change-password" element={<Navigate to="/staff/change-password" replace />} />

        {/* Dealer layout with persistent sidebar - all sub-pages nested */}
        <Route
          path="/dealer"
          element={
            <RoleProtectedRoute allowedRoles={['dealer']}>
              <DealerLayout />
            </RoleProtectedRoute>
          }
        >
          {/* <Route index element={<DealerDashboard />} /> */}
          <Route index element={<DealerWarrantyCodes />} />
          <Route path="inventory" element={<DealerInventory />} />
          <Route path="purchase-history" element={<DealerPurchaseHistory />} />
          <Route path="sales-entry" element={<DealerSalesEntry />} />
          <Route path="register" element={<RegisterProduct />} />
          <Route path="claims" element={<DealerClaimsManagement />} />
          <Route path="warranty-codes" element={<DealerWarrantyCodes />} />
          <Route path="warranty-claims" element={<DealerWarrantyClaims />} />
          <Route path="payments" element={<DealerPayments />} />
          <Route path="reports" element={<Analytics />} />
          <Route path="business-profile" element={<DealerBusinessProfile />} />
          <Route path="approvals" element={<ApprovalQueue />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="edit-profile" element={<DealerEditProfile />} />
          <Route path="change-password" element={<DealerChangePassword />} />
        </Route>

        {/* Legacy dealer routes - redirect to new paths */}
        <Route path="/approval-queue" element={<Navigate to="/dealer/approvals" replace />} />
        <Route path="/dealer-edit-profile" element={<Navigate to="/dealer/edit-profile" replace />} />
        <Route path="/dealer-change-password" element={<Navigate to="/dealer/change-password" replace />} />

        {/* Super Admin layout */}
        <Route
          path="/super-admin"
          element={
            <RoleProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="providers" element={<SuperAdminProviders />} />
          <Route path="providers/:providerId/detail" element={<SuperAdminProviderDetail />} />
          <Route path="providers/:providerId/coins" element={<SuperAdminManageCoins />} />
          <Route path="activity-logs" element={<SuperAdminActivityLogs />} />
          <Route path="warranty-codes" element={<SuperAdminWarrantyCodes />} />
          <Route path="warranty-registrations" element={<SuperAdminWarrantyRegistrations />} />
          <Route path="coin-pricing" element={<SuperAdminCoinPricing />} />
          <Route path="change-password" element={<SuperAdminChangePassword />} />
        </Route>

        {/* Service Center layout */}
        <Route
          path="/service-center"
          element={
            <RoleProtectedRoute allowedRoles={['service_center']}>
              <ServiceCenterLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<ServiceCenterDashboard />} />
          <Route path="claims" element={<ServiceCenterClaims />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="profile" element={<ServiceCenterProfile />} />
          <Route path="change-password" element={<ServiceCenterChangePassword />} />
        </Route>

        {/* Catch all - redirect to appropriate home if logged in, otherwise to landing */}
        <Route
          path="*"
          element={
            token ? (
              (() => {
                try {
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  const ut = user?.user_type || user?.role;
                  if (ut === "super_admin") return <Navigate to="/super-admin" replace />;
                } catch {}
                return <Navigate to="/home" replace />;
              })()
            ) : (
              <Navigate to="/landing" replace />
            )
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
